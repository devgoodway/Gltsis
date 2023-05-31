import express from "express";
const router = express.Router();
import { isOwner } from "../middleware/auth.js";
import * as academies from "../controllers/academies.js";
import * as users from "../controllers/users.js";
import * as schools from "../controllers/schools.js";
import * as seasons from "../controllers/seasons.js";
import * as registrations from "../controllers/registrations.js";

//=================================
//             Academy
//=================================

router.post("/", isOwner, academies.create);
router.get("/", academies.find);

router.put("/:academyId/activate", isOwner, academies.activate);
router.put("/:academyId/inactivate", isOwner, academies.inactivate);

router.put("/:academyId/email", isOwner, academies.updateEmail);
router.put("/:academyId/tel", isOwner, academies.updateTel);

router.delete("/:academyId", isOwner, academies.remove);

/* get/delete documents */
router.get("/:academyId/users/:_id?", isOwner, users.find);
router.get("/:academyId/:docType/:docId?", isOwner, academies.findDocuments);

export { router };
