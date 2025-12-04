"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!req.user.roles?.some((role) => roles.includes(role))) { // check if user has at least one of the required roles
            return res.status(403).json({
                message: `Require ${roles.join(", ")} role`
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// [].includes
