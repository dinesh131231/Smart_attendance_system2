import requestIp from 'request-ip';
import ipRangeCheck from 'ip-range-check';
import Settings from '../models/Settings.js';

// ─── IP Restriction Middleware ────────────────────────────────────────────────
export const ipRestrict = async (req, res, next) => {
    try {
        const settings = await Settings.findOne();

        // If restriction is explicitly disabled, allow all
        if (!settings?.ipRestrictionEnabled) {
            return next();
        }

        // Restriction is ON but no IPs configured → block everyone
        if (!settings?.allowedIp || settings.allowedIp.trim() === '') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Please connect to the authorized WiFi network. No allowed IPs have been configured.'
            });
        }

        // Extract client IP (handles proxies, x-forwarded-for, IPv4/IPv6)
        const clientIp = requestIp.getClientIp(req);

        if (!clientIp) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Could not determine your IP. Please connect to the authorized WiFi network and try again.'
            });
        }

        // Normalize IPv6-mapped IPv4 addresses e.g. ::ffff:192.168.1.1 → 192.168.1.1
        const normalizedIp = clientIp.replace(/^::ffff:/, '');

        const allowedList = settings.allowedIp
            .split(',')
            .map(ip => ip.trim())
            .filter(Boolean);

        console.log(`IP Check → Client: ${normalizedIp} | Allowed: ${allowedList}`);

        const isAllowed = ipRangeCheck(normalizedIp, allowedList);

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                message: `Access denied: Please connect to the authorized WiFi network. Your IP (${normalizedIp}) is not allowed.`
            });
        }

        req.clientIp = normalizedIp;
        next();

    } catch (error) {
        console.error('ipRestrict error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};