const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

// GET /api/posts?page=1&limit=10 : 포스트 목록 가져오기
router.get("/", async (req, res) => {
  // 쿼리 파라미터 파싱(기본값 설정)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  //기존 코드랑 동일하게
  const from = (page - 1) * limit;
  const to = page * limit - 1;

  try {
    const { data, error, count } = await supabase
      .from("posts")
      .select(
        `
        *,
        users!id(user_id, nickname, email, profile_url)
        `,
        { count: "exact" }
      )
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "포스트 목록을 불러오는데 실패했습니다",
        error: error.message,
      });
    }

    const hasNext = to + 1 < (count || 0);

    return res.status(200).json({
      success: true,
      data,
      hasNext,
      nextPage: page + 1,
      count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// GET /api/posts/initial : 최신 포스트 5개 가져오기
router.get("/initial", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .range(0, 4)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "최초 포스트 목록을 불러오는데 실패했습니다",
        error: error.message,
      });
    }
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// GET /api/posts/:postId : 포스트 1개 가져오기
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users!id(user_id, nickname, email, profile_url)
        `
      )
      .eq("id", postId)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "포스트를 불러오는데 실패했습니다",
        error: error.message,
      });
    }
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// POST /api/posts
router.post("/", async (req, res) => {
  const { user_id, title, content, image_urls } = req.body;

  if (!user_id || !title || !content) {
    return res.status(400).json({
      success: false,
      message: "user_id, title, content는 필수입니다",
    });
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id,
        title,
        content,
        image_urls: image_urls || [],
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "포스트 등록에 실패했습니다",
        error: error.message,
      });
    }
    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// DELETE /api/posts/:postId
router.delete("/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .select();
    if (error) {
      return res.status(500).json({
        success: false,
        message: "포스트를 삭제하는데 실패했습니다",
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

// GET /api/posts/:postId/comments
router.get("/:postId/comments", async (req, res) => {
  const { postId } = req.params;

  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        users!id(user_id, nickname, email, profile_url)
        `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "댓글 목록을 불러오는데 실패했습니다",
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

// POST /api/posts/:postId/comments
router.post("/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { user_id, comment } = req.body;

  if (!user_id || !comment) {
    return res.status(400).json({
      success: false,
      message: "user_id와 comment는 필수입니다",
    });
  }

  try {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id,
        post_id: postId,
        comment,
      })
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
        message: "댓글 등록에 실패했습니다",
        error: error.message,
      });
    }

    return res.status(201).json({
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
