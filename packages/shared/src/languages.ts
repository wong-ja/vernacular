export const LANGUAGES = [
  { code: 'zho_Hans', name: 'Mandarin (Simplified)', nativeName: '普通话（简体）', region: 'East Asia' },
  { code: 'zho_Hant', name: 'Mandarin (Traditional)', nativeName: '普通話（繁體）', region: 'East Asia' },
  { code: 'yue_Hant', name: 'Cantonese', nativeName: '廣東話', region: 'East Asia' },
  { code: 'jpn_Jpan', name: 'Japanese', nativeName: '日本語', region: 'East Asia' },
  { code: 'kor_Hang', name: 'Korean', nativeName: '한국어', region: 'East Asia' },
  { code: 'bod_Tibt', name: 'Tibetan', nativeName: 'བོད་སྐད', region: 'East Asia' },
  { code: 'mon_Cyrl', name: 'Mongolian', nativeName: 'Монгол', region: 'East Asia' },

  { code: 'tgl_Latn', name: 'Tagalog (Filipino)', nativeName: 'Tagalog', region: 'Southeast Asia' },
  { code: 'vie_Latn', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Southeast Asia' },
  { code: 'tha_Thai', name: 'Thai', nativeName: 'ไทย', region: 'Southeast Asia' },
  { code: 'mya_Mymr', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', region: 'Southeast Asia' },
  { code: 'khm_Khmr', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', region: 'Southeast Asia' },
  { code: 'lao_Laoo', name: 'Lao', nativeName: 'ລາວ', region: 'Southeast Asia' },
  { code: 'ind_Latn', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Southeast Asia' },
  { code: 'msa_Latn', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Southeast Asia' },
  { code: 'ceb_Latn', name: 'Cebuano', nativeName: 'Cebuano', region: 'Southeast Asia' },
  { code: 'ilo_Latn', name: 'Ilocano', nativeName: 'Iloco', region: 'Southeast Asia' },
  { code: 'hil_Latn', name: 'Hiligaynon', nativeName: 'Hiligaynon', region: 'Southeast Asia' },
  { code: 'war_Latn', name: 'Waray', nativeName: 'Winaray', region: 'Southeast Asia' },
  { code: 'pag_Latn', name: 'Pangasinan', nativeName: 'Pangasinan', region: 'Southeast Asia' },
  { code: 'pam_Latn', name: 'Kapampangan', nativeName: 'Kapampangan', region: 'Southeast Asia' },
  { code: 'jav_Latn', name: 'Javanese', nativeName: 'Basa Jawa', region: 'Southeast Asia' },
  { code: 'sun_Latn', name: 'Sundanese', nativeName: 'Basa Sunda', region: 'Southeast Asia' },
  { code: 'tet_Latn', name: 'Tetum', nativeName: 'Tetun', region: 'Southeast Asia' },
  { code: 'div_Thaa', name: 'Dhivehi (Maldivian)', nativeName: 'ދިވެހި', region: 'Southeast Asia' },
  { code: 'hmn_Latn', name: 'Hmong', nativeName: 'Hmoob', region: 'Southeast Asia' },

  { code: 'hin_Deva', name: 'Hindi', nativeName: 'हिन्दी', region: 'South Asia' },
  { code: 'ben_Beng', name: 'Bengali', nativeName: 'বাংলা', region: 'South Asia' },
  { code: 'urd_Arab', name: 'Urdu', nativeName: 'اردو', region: 'South Asia' },
  { code: 'tam_Taml', name: 'Tamil', nativeName: 'தமிழ்', region: 'South Asia' },
  { code: 'tel_Telu', name: 'Telugu', nativeName: 'తెలుగు', region: 'South Asia' },
  { code: 'mar_Deva', name: 'Marathi', nativeName: 'मराठी', region: 'South Asia' },
  { code: 'guj_Gujr', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'South Asia' },
  { code: 'kan_Knda', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'South Asia' },
  { code: 'mal_Mlym', name: 'Malayalam', nativeName: 'മലയാളം', region: 'South Asia' },
  { code: 'pan_Guru', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'South Asia' },
  { code: 'sin_Sinh', name: 'Sinhala', nativeName: 'සිංහල', region: 'South Asia' },
  { code: 'nep_Deva', name: 'Nepali', nativeName: 'नेपाली', region: 'South Asia' },
  { code: 'ori_Orya', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'South Asia' },
  { code: 'asm_Beng', name: 'Assamese', nativeName: 'অসমীয়া', region: 'South Asia' },

  { code: 'fij_Latn', name: 'Fijian', nativeName: 'Na Vosa Vakaviti', region: 'Pacific Islands' },
  { code: 'smo_Latn', name: 'Samoan', nativeName: 'Gagana Samoa', region: 'Pacific Islands' },
  { code: 'ton_Latn', name: 'Tongan', nativeName: 'Lea Faka-Tonga', region: 'Pacific Islands' },
  { code: 'haw_Latn', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', region: 'Pacific Islands' },
  { code: 'mri_Latn', name: 'Māori', nativeName: 'Te Reo Māori', region: 'Pacific Islands' },
  { code: 'cha_Latn', name: 'Chamorro', nativeName: 'Finuʼ Chamorro', region: 'Pacific Islands' },
  { code: 'gil_Latn', name: 'Kiribati', nativeName: 'Taetae ni Kiribati', region: 'Pacific Islands' },
  { code: 'tah_Latn', name: 'Tahitian', nativeName: 'Reo Tahiti', region: 'Pacific Islands' },
  { code: 'mah_Latn', name: 'Marshallese', nativeName: 'Kajin M̧ajeļ', region: 'Pacific Islands' },

  { code: 'pes_Arab', name: 'Persian (Farsi)', nativeName: 'فارسی', region: 'Central & West Asia' },
  { code: 'prs_Arab', name: 'Dari', nativeName: 'دری', region: 'Central & West Asia' },
  { code: 'pus_Arab', name: 'Pashto', nativeName: 'پښتو', region: 'Central & West Asia' },
  { code: 'kur_Arab', name: 'Kurdish (Sorani)', nativeName: 'کوردی', region: 'Central & West Asia' },
  { code: 'kmr_Latn', name: 'Kurdish (Kurmanji)', nativeName: 'Kurdî', region: 'Central & West Asia' },
  { code: 'kaz_Cyrl', name: 'Kazakh', nativeName: 'Қазақша', region: 'Central & West Asia' },
  { code: 'uzb_Latn', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Central & West Asia' },

  { code: 'eng_Latn', name: 'English', nativeName: 'English', region: 'European' },
  { code: 'spa_Latn', name: 'Spanish', nativeName: 'Español', region: 'European' },
  { code: 'fra_Latn', name: 'French', nativeName: 'Français', region: 'European' },
  { code: 'deu_Latn', name: 'German', nativeName: 'Deutsch', region: 'European' },
  { code: 'por_Latn', name: 'Portuguese', nativeName: 'Português', region: 'European' },
  { code: 'ita_Latn', name: 'Italian', nativeName: 'Italiano', region: 'European' },
  { code: 'nld_Latn', name: 'Dutch', nativeName: 'Nederlands', region: 'European' },
  { code: 'rus_Cyrl', name: 'Russian', nativeName: 'Русский', region: 'European' },
  { code: 'pol_Latn', name: 'Polish', nativeName: 'Polski', region: 'European' },
  { code: 'tur_Latn', name: 'Turkish', nativeName: 'Türkçe', region: 'European' },

  { code: 'ara_Arab', name: 'Arabic', nativeName: 'العربية', region: 'Middle East & Africa' },
  { code: 'hat_Latn', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', region: 'Middle East & Africa' },
  { code: 'yor_Latn', name: 'Yoruba', nativeName: 'Yorùbá', region: 'Middle East & Africa' },
  { code: 'wol_Latn', name: 'Wolof', nativeName: 'Wolof', region: 'Middle East & Africa' },
] as const;

export type LanguageDef = (typeof LANGUAGES)[number];
export type LanguageRegion = LanguageDef['region'];

export const LANGUAGE_CODES: readonly string[] = LANGUAGES.map((l) => l.code);
export const LANGUAGE_MAP: Record<string, LanguageDef> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l])
) as Record<string, LanguageDef>;

export function getLanguagesByRegion(region: LanguageRegion): LanguageDef[] {
  return LANGUAGES.filter((l) => l.region === region) as LanguageDef[];
}

export const REGIONS: LanguageRegion[] = [
  'East Asia',
  'Southeast Asia',
  'South Asia',
  'Pacific Islands',
  'Central & West Asia',
  'European',
  'Middle East & Africa',
];
