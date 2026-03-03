const axios = require('axios');
const OpenAI = require('openai');
const ProviderService = require('../models/ProviderService');
const ProviderProfile = require('../models/ProviderProfile');
const Service = require('../models/Service');
const User = require('../models/User');

// Initialize OpenAI client (only if API key is provided)
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

// @desc    Get AI-powered service recommendations
// @route   POST /api/ai/service-recommendation
// @access  Private
exports.getServiceRecommendation = async (req, res) => {
    try {
        const { serviceDescription, budget, location } = req.body;

        if (!openai) {
            // Return mock data if OpenAI is not configured
            return res.status(200).json({
                success: true,
                data: {
                    recommendations: [
                        {
                            service: 'Plumbing Repair',
                            description: 'Fix leaky faucets and clogged drains',
                            estimatedTime: '1-2 hours',
                            costRange: '₹800-₹1500',
                            providersAvailable: 5
                        },
                        {
                            service: 'Electrician',
                            description: 'Electrical repairs and installations',
                            estimatedTime: '2-4 hours',
                            costRange: '₹1200-₹2500',
                            providersAvailable: 3
                        },
                        {
                            service: 'Home Cleaning',
                            description: 'Deep cleaning service for homes',
                            estimatedTime: '3-5 hours',
                            costRange: '₹1500-₹3000',
                            providersAvailable: 8
                        }
                    ],
                    message: 'These are popular services based on your needs. Please note: This is AI-generated recommendation.'
                }
            });
        }

        // Create AI prompt for service recommendation
        const prompt = `
        Based on the following service request, provide 3-5 service recommendations:
        Description: ${serviceDescription}
        Budget: ${budget}
        Location: ${location}
        
        Respond in JSON format with:
        - service: Name of the service
        - description: Brief description
        - estimatedTime: Estimated time to complete
        - costRange: Cost range for the service
        - providersAvailable: Approximate number of providers available
        
        Return only the JSON response.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 500
        });

        const aiResponse = completion.choices[0].message.content.trim();
        
        // Try to parse the JSON response from AI
        let parsedResponse;
        try {
            // Extract JSON from the response if it's wrapped in markdown code block
            const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
            parsedResponse = JSON.parse(jsonString);
        } catch (parseError) {
            // If parsing fails, return a generic response
            parsedResponse = {
                recommendations: [],
                message: 'AI service recommendation is currently unavailable. Please try again later.',
                error: parseError.message
            };
        }

        res.status(200).json({
            success: true,
            data: parsedResponse
        });

    } catch (err) {
        console.error('AI Service Recommendation Error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'AI service recommendation failed'
        });
    }
};

// @desc    Get AI-powered chat response
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithAI = async (req, res) => {
    try {
        const { message, role: roleFromBody } = req.body;
        const role = req.user?.role || roleFromBody || 'customer';
        const key = process.env.GROQ_API_KEY;
        if (!key) {
            return res.status(503).json({
                success: false,
                error: 'AI service unavailable'
            });
        }
        const rolePrompt =
            role === 'admin'
                ? 'You assist with managing users, approvals, audits, settings, and reports.'
                : role === 'provider'
                ? 'You assist with creating services, managing jobs, documents, contracts, and earnings.'
                : role === 'worker'
                ? 'You assist with understanding assignments, job status, and provider instructions.'
                : 'You assist with booking services, finding providers, payments, and checking booking status.';
        const systemContent = 'You are an intelligent AI assistant for a local home services marketplace. Help users with booking services, provider workflows, worker assignment, pricing, contracts, and platform usage. Provide concise, structured answers. Do not invent features or provide unsafe recommendations.';
        let dynamicContext = '';
        try {
            const lower = String(message || '').toLowerCase();
            const isPricingQuery = ['price', 'pricing', 'cost', 'quote', 'rate', 'package'].some(k => lower.includes(k));
            if (isPricingQuery) {
                const offerings = await ProviderService.find({ isActive: true })
                    .populate({
                        path: 'service',
                        select: 'name category',
                        populate: { path: 'category', select: 'name' }
                    })
                    .populate({
                        path: 'provider',
                        select: 'user',
                        populate: { path: 'user', select: 'name' }
                    })
                    .select('providerPrice pricingType service provider')
                    .limit(25)
                    .lean();
                // Summarize by service
                const byService = new Map();
                for (const o of offerings) {
                    const keyS = o.service?.name || 'Unknown';
                    const entry = byService.get(keyS) || { count: 0, min: Infinity, max: -Infinity, types: new Set(), category: o.service?.category?.name };
                    entry.count += 1;
                    const p = typeof o.providerPrice === 'number' ? o.providerPrice : null;
                    if (p !== null) {
                        entry.min = Math.min(entry.min, p);
                        entry.max = Math.max(entry.max, p);
                    }
                    if (o.pricingType) entry.types.add(o.pricingType);
                    byService.set(keyS, entry);
                }
                const lines = [];
                for (const [svc, info] of byService.entries()) {
                    const min = info.min === Infinity ? null : info.min;
                    const max = info.max === -Infinity ? null : info.max;
                    lines.push(`${svc} | category: ${info.category || '-'} | providers: ${info.count} | priceRange: ${min !== null && max !== null ? `₹${min}-₹${max}` : 'N/A'} | pricingTypes: ${Array.from(info.types).join(', ') || 'N/A'}`);
                }
                if (lines.length > 0) {
                    dynamicContext = `Live Pricing Snapshot:\n${lines.slice(0, 10).join('\n')}\nUse these values; do not state generic pricing. If the user asks about a specific service, reference its row.`;
                }
            }
        } catch {}
        const messages = [
            { role: 'system', content: `${systemContent} Role: ${role}. ${rolePrompt}` },
            dynamicContext ? { role: 'system', content: dynamicContext } : null,
            { role: 'user', content: message }
        ].filter(Boolean);
        const body = {
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.3
        };
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            body,
            {
                headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        const text = response?.data?.choices?.[0]?.message?.content?.trim();
        if (!text) {
            return res.status(502).json({
                success: false,
                error: 'AI response empty'
            });
        }
        return res.status(200).json({ success: true, data: { response: text } });
    } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.error || err?.message || 'AI service unavailable';
        return res.status(503).json({
            success: false,
            error: msg,
            status
        });
    }
};

// @desc    Summarize reviews for a service
// @route   POST /api/ai/review-summary
// @access  Private
exports.summarizeReviews = async (req, res) => {
    try {
        const { reviews, service } = req.body;

        if (!openai) {
            // Return mock response if OpenAI is not configured
            return res.status(200).json({
                success: true,
                data: {
                    summary: 'This is a simulated review summary. To enable real AI features, please set your OPENAI_API_KEY in the environment variables.',
                    keyPoints: ['Service quality', 'Communication', 'Timeliness', 'Overall satisfaction'],
                    sentiment: 'Positive',
                    highlights: ['Professional service', 'Good communication', 'On-time arrival']
                }
            });
        }

        // Create AI prompt for review summarization
        const reviewsText = reviews.map(r => `Rating: ${r.rating}/5, Comment: ${r.comment}`).join('\n');
        const prompt = `
        Summarize the following reviews for the service "${service}":
        ${reviewsText}
        
        Provide:
        1. A brief overall summary
        2. Key points mentioned in reviews
        3. Overall sentiment (positive/neutral/negative)
        4. Main highlights/compliments
        5. Areas for improvement (if any)
        
        Respond in JSON format with these fields.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-3.5-turbo',
            temperature: 0.5,
            max_tokens: 500
        });

        const aiResponse = completion.choices[0].message.content.trim();
        
        // Try to parse the JSON response from AI
        let parsedResponse;
        try {
            // Extract JSON from the response if it's wrapped in markdown code block
            const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
            parsedResponse = JSON.parse(jsonString);
        } catch (parseError) {
            // If parsing fails, return a generic response
            parsedResponse = {
                summary: aiResponse.substring(0, 200) + '...',
                keyPoints: ['Could not parse AI response'],
                sentiment: 'Unknown',
                highlights: ['Review summary feature requires proper AI configuration'],
                improvements: ['Properly formatted AI response needed']
            };
        }

        res.status(200).json({
            success: true,
            data: parsedResponse
        });

    } catch (err) {
        console.error('AI Review Summary Error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'AI review summary failed'
        });
    }
};

// @desc    Health check for AI configuration
// @route   GET /api/ai/health
// @access  Private
exports.getAiHealth = async (req, res) => {
    const configured = Boolean(process.env.GROQ_API_KEY);
    return res.status(200).json({
        success: true,
        data: { configured }
    });
};
