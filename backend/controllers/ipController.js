import Settings  from '../models/Settings.js';

// ─── Admin: Set Allowed IP ────────────────────────────────────────────────────
export const setAllowedIp = async (req, res) => {
    try {
        const { ips, ipLabel } = req.body;
        // ips can be array ["192.168.1.1", "10.0.0.0/24"] or single string

        const ipString = Array.isArray(ips) ? ips.join(', ') : ips;

        const settings = await Settings.findOneAndUpdate(
            {},
            {
                allowedIp: ipString,
                ipLabel: ipLabel || null,
                ipRestrictionEnabled: true,
                updatedBy: req.user._id
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.json({ success: true, message: 'IP restriction updated', settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ─── Admin: Get Current Allowed IP ───────────────────────────────────────────
export const getAllowedIp = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json({ success: true, allowedIp: settings?.allowedIp || null });
    } catch (error) {
        console.error('getAllowedIp error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin: Remove IP Restriction ────────────────────────────────────────────
export const removeAllowedIp = async (req, res) => {
    try {
        await Settings.findOneAndUpdate({}, { allowedIp: null }, { upsert: true, returnDocument: 'after' });
        res.json({ success: true, message: 'IP restriction removed' });
    } catch (error) {
        console.error('removeAllowedIp error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Student: Check If Their IP Is Allowed ───────────────────────────────────
export const checkIp = async (req, res) => {
    try {
        const settings = await Settings.findOne();

        // No restriction set — allow everyone
        if (!settings?.allowedIp) {
            return res.json({ success: true, message: 'No IP restriction set' });
        }

        // Extract client IP
        const clientIp = (
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket.remoteAddress ||
            ''
        ).replace('::ffff:', '').trim();

        console.log('Client IP:', clientIp, '| Allowed IP:', settings.allowedIp);

        if (clientIp !== settings.allowedIp) {
            return res.status(403).json({
                success: false,
                message: `Access denied: your network (${clientIp}) is not allowed`
            });
        }

        res.json({ success: true, message: 'IP verified', clientIp });
    } catch (error) {
        console.error('checkIp error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};