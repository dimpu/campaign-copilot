import type { CopyVariant } from "@/lib/schemas/campaign-config";

const copyTemplates: Record<string, Record<string, CopyVariant>> = {
	en: {
		short_video_review: {
			locale: "en",
			subject: "🎥 Create & earn with us!",
			title: "Show off your style & get rewarded",
			body: "We're looking for creators to showcase our latest products in short videos. Create authentic content, tag us, and earn competitive commissions. No complicated rules — just great content and great rewards.",
			ctaText: "Apply Now",
			hashtags: ["#TikTokShop", "#CreatorCollab", "#GetPaid"],
			tone: "casual",
		},
		default: {
			locale: "en",
			subject: "🚀 New collab opportunity!",
			title: "Create content, earn rewards",
			body: "Join our latest campaign and start earning with your content. Flexible formats, competitive payouts, and full creative freedom. We handle the logistics — you focus on creating amazing content.",
			ctaText: "Join Now",
			hashtags: ["#TikTokShop", "#CreatorCollab", "#EarnWithUs"],
			tone: "casual",
		},
	},
	id: {
		default: {
			locale: "id",
			subject: "🚀 Kesempatan kolaborasi baru!",
			title: "Buat konten, dapatkan hadiah",
			body: "Bergabunglah dengan kampanye terbaru kami dan mulailah menghasilkan dengan konten Anda. Format fleksibel, pembayaran kompetitif, dan kebebasan berkreasi penuh. Kami yang urus logistiknya — Anda fokus bikin konten keren.",
			ctaText: "Gabung Sekarang",
			hashtags: ["#TikTokShop", "#KolaborasiKreator", "#Hasilkan"],
			tone: "casual",
		},
	},
	th: {
		default: {
			locale: "th",
			subject: "🚀 โอกาสคอลแล็บใหม่!",
			title: "สร้างคอนเทนต์ รับรางวัล",
			body: "เข้าร่วมแคมเปญล่าสุดของเราและเริ่มสร้างรายได้ด้วยคอนเทนต์ของคุณ รูปแบบยืดหยุ่น จ่ายค่าตอบแทนสูง และอิสระในการสร้างสรรค์เต็มที่ เราจัดการโลจิสติกส์ให้ — คุณโฟกัสที่การสร้างคอนเทนต์เจ๋งๆ",
			ctaText: "สมัครเลย",
			hashtags: ["#TikTokShop", "#คอลแล็บครีเอเตอร์", "#สร้างรายได้"],
			tone: "casual",
		},
	},
	vi: {
		default: {
			locale: "vi",
			subject: "🚀 Cơ hội hợp tác mới!",
			title: "Sáng tạo nội dung, nhận thưởng",
			body: "Tham gia chiến dịch mới nhất của chúng tôi và bắt đầu kiếm tiền với nội dung của bạn. Định dạng linh hoạt, thanh toán cạnh tranh và tự do sáng tạo hoàn toàn. Chúng tôi lo hậu cần — bạn tập trung sáng tạo nội dung tuyệt vời.",
			ctaText: "Tham gia ngay",
			hashtags: ["#TikTokShop", "#HopTacSangTao", "#KiemTien"],
			tone: "casual",
		},
	},
};

export function getMockCopy(locale: string, taskType: string): CopyVariant {
	const localeTemplates = copyTemplates[locale] ?? copyTemplates.en;
	return (
		localeTemplates[taskType] ??
		localeTemplates.default ??
		copyTemplates.en.default
	);
}

export function getMockCopyForLocales(
	locales: string[],
	taskType: string,
): CopyVariant[] {
	return locales.map((locale) => getMockCopy(locale, taskType));
}
