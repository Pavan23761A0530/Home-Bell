const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');

/**
 * Find providers within a specific radius who offer the requested service
 * and are available for new jobs.
 * 
 * @param {Array} coordinates - [longitude, latitude]
 * @param {String} serviceId - The ID of the service being requested
 * @param {Number} maxDistanceKm - Maximum distance in Kilometers
 * @returns {Promise<Array>} - List of suitable provider profiles
 */
const SystemSetting = require('../models/SystemSetting');

exports.findNearbyProviders = async (coordinates, serviceId, maxDistanceKm = 50) => {
    try {
        // Fetch dynamic settings
        let searchRadius = maxDistanceKm;
        let limitActiveJobs = 3;

        try {
            const radiusSetting = await SystemSetting.findOne({ key: 'searchRadius' });
            if (radiusSetting) searchRadius = radiusSetting.value;

            const jobsSetting = await SystemSetting.findOne({ key: 'maxActiveJobs' });
            if (jobsSetting) limitActiveJobs = jobsSetting.value;
        } catch (err) {
            console.log("Using default settings due to error:", err.message);
        }

        // 1. Find providers within radius using 2dsphere index
        const providers = await ProviderProfile.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: coordinates
                    },
                    $maxDistance: searchRadius * 1000 // Convert to meters
                }
            },
            // 2. Filter by verification and availability
            isVerified: true,
            availability: true,

            // 3. Check if they offer the service
            'servicesOffered.service': serviceId
        }).populate('user', 'name email');

        // 4. Client-side filtering for complex logic (max jobs) 
        // MongoDB query for this activeJobs < maxActiveJobs comparison is complex 
        // to do directly in the FIND query without $expr which might not use the geospatial index efficiently.
        // Since the number of nearby providers is likely manageable, we filter in code.

        const availableProviders = providers.filter(provider => {
            // Use dynamic limit if available, otherwise provider's own limit if set, else default
            // Here we prefer the system-wide limit for fairness, or we could take the min of the two.
            // Let's use the system wide limit as the hard cap override.
            return provider.currentActiveJobs < limitActiveJobs;
        });

        return availableProviders;
    } catch (error) {
        console.error("GeoService Error:", error);
        throw error;
    }
};
