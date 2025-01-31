import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch"; // لجلب الأخبار

dotenv.config();
process.removeAllListeners("warning");

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.resolve();
app.use(express.static(__dirname));

const openai = new OpenAI({
    apiKey: process.env.OpenAi_API_key 
});

// **🔹 مسار رئيسي يعرض الصفحة**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// **🔹 مسار API لجلب الأخبار من News API**
app.post("/get-news", async (req, res) => {
    const { keyword } = req.body;

    try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&language=ar&apiKey=${process.env.News_API_key}`);
        const data = await response.json();

        if (data.status !== "ok") {
            throw new Error("فشل في جلب الأخبار.");
        }

        res.json({ articles: data.articles.slice(0, 15) }); // جلب 15 أخبار فقط
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "فشل في جلب الأخبار." });
    }
});

// **🔹 مسار API لتلخيص الأخبار باستخدام OpenAI**
app.post("/summarize-news", async (req, res) => {
    const { newsText } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "أنت مساعد ذكي يقوم بتلخيص الأخبار والمقالات." },
                { role: "user", content: `الرجاء تلخيص الأخبار التالية:\n\n${newsText}` }
            ]
        });

        res.json({ summary: response.choices[0].message.content });
    } catch (error) {
        console.error("Error summarizing news:", error);
        res.status(500).json({ error: "فشل في تلخيص الأخبار." });
    }
});

// **🔹 تشغيل الخادم**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`);
});
