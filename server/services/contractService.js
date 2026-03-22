/**
 * Generate a contract string by replacing placeholders with actual data.
 * 
 * @param {String} template - The raw template string
 * @param {Object} data - The data object containing values for placeholders
 * @returns {String} - The processed contract content
 */
exports.generateContractContent = (template, data) => {
    let content = template;

    // Standard placeholders
    const replacements = {
        '{{customerName}}': data.customerName,
        '{{providerName}}': data.providerName,
        '{{serviceName}}': data.serviceName,
        '{{price}}': data.price,
        '{{date}}': new Date(data.date).toLocaleDateString(),
        '{{address}}': data.address
    };

    for (const [key, value] of Object.entries(replacements)) {
        // Global replace
        content = content.split(key).join(value || 'N/A');
    }

    return content;
};

exports.defaultTemplate = `
SERVICE AGREEMENT

This Agreement is made on {{date}} between:

Provider: {{providerName}}
Customer: {{customerName}}

Service: {{serviceName}}
Price: \${{price}}
Location: {{address}}

1. Scope of Work
The Provider agrees to perform the Service described above at the Location.

2. Payment
The Customer agrees to pay the Price upon completion of the Service.

3. Dispute Resolution
Any disputes shall be resolved through the LocalServe platform dispute resolution center.

Signed (Provider): ___________________
Signed (Customer): ___________________
`;
