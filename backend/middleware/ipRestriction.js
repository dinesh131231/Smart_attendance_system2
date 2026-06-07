// import requestIp from 'request-ip';
// import ipRangeCheck from 'ip-range-check';
// import  Settings  from '../models/Settings.js';

// // ─── IP Restriction Middleware ────────────────────────────────────────────────
// export const ipRestrict = async (req, res, next) => {
//     try {
//         const settings = await Settings.findOne();

//         // No settings, no IP set, or restriction disabled — allow everyone
//         if (!settings?.allowedIp || !settings?.ipRestrictionEnabled) {
//             return next();
//         }

//         // Extract client IP using request-ip (handles proxies, x-forwarded-for, etc.)
//         const clientIp = requestIp.getClientIp(req);

//         if (!clientIp) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Could not determine client IP'
//             });
//         }

//         console.log(`IP Check → Client: ${clientIp} | Allowed: ${settings.allowedIp}`);

//         // ip-range-check supports:
//         // - exact IP:   "192.168.1.100"
//         // - CIDR range: "192.168.1.0/24"
//         // - array:      ["192.168.1.1", "10.0.0.0/8"]
//         const allowedList = settings.allowedIp
//             .split(',')
//             .map(ip => ip.trim())
//             .filter(Boolean);

//         const isAllowed = ipRangeCheck(clientIp, allowedList);

//         if (!isAllowed) {
//             return res.status(403).json({
//                 success: false,
//                 message: `Access denied: your IP (${clientIp}) is not allowed`
//             });
//         }

//         // Attach client IP to request for use in controllers
//         req.clientIp = clientIp;
//         next();
//     } catch (error) {
//         console.error('ipRestrict error:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };


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