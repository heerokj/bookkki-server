const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");
const authMiddleware = require("../middleware/auth");

// PATCH /api/comments/:commentId
router.patch("/:commentId", authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({
      success: false,
      message: "comment는 필수입니다",
    });
  }

  try {
    const { data, error } = await supabase
      .from("comments")
      .update({ comment })
      .eq("id", commentId)
      .select(
        `
        *,
        users!id(user_id, nickname, email, profile_url)
        `
      )
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "댓글 수정에 실패했습니다",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// DELETE /api/comments/:commentId
router.delete("/:commentId", authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  try {
    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "댓글을 삭제하는데 실패했습니다",
        error: error.message,
      });
    }
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

module.exports = router;
