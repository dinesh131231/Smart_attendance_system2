import { setAllowedIp, getAllowedIp, removeAllowedIp, checkIp } from '../controllers/ipController.js';
import { adminAuth ,studentAuth } from '../middleware/authmiddleware.js';
import router from './studentsRoute.js';

// Admin only
router.post('/settings/allowed-ip', adminAuth, setAllowedIp);
router.get('/settings/allowed-ip', adminAuth, getAllowedIp);
router.delete('/settings/allowed-ip', adminAuth, removeAllowedIp);

// Student (called on student page mount)
router.get('/api/settings/check-ip', studentAuth, checkIp);

export default router