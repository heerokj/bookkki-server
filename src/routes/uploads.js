const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const supabase = require("../lib/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

//POST /api/uploads/images : 이미지 업로드
router.post(
  "/images",
  authMiddleware,
  upload.array("images", 6),
  async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "업로드할 이미지가 없습니다",
      });
    }

    try {
      const uploadUrls = [];

      for (const file of files) {
        const fileExt = file.originalname.split(".").pop();
        const fileName = `post/${uuid()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("images")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          return res.status(500).json({
            success: false,
            message: "이미지 업로드에 실패했습니다",
            error: error.message,
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(data.path);

        uploadUrls.push(publicUrlData.publicUrl);
      }

      return res.status(200).json({
        success: true,
        data: uploadUrls,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "서버 오류가 발생했습니다",
        error: error.message,
      });
    }
  }
);

module.exports = router;
