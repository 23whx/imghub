import { Upload, ChevronDown } from 'lucide-react';

const heroes = [
  { id: 'jobs', name: '乔布斯', image: '/assets/heroes/hero_Jobs.png' },
  { id: 'luxun', name: '鲁迅', image: '/assets/heroes/hero_LuXun.png' },
  { id: 'mayun', name: '马云', image: '/assets/heroes/hero_MaYun.png' },
  { id: 'moyan', name: '莫言', image: '/assets/heroes/hero_Moyan.png' },
  { id: 'musk', name: '马斯克', image: '/assets/heroes/hero_Musk.png' },
  { id: 'yuhua', name: '余华', image: '/assets/heroes/hero_Yuhua.png' },
];

const HeroSelector = ({ selectedHero, onHeroChange, customImage, onCustomImageChange, language }) => {
  // 语言配置
  const languages = {
    en: {
      selectCelebrity: 'Select Celebrity Background',
      uploadCustom: 'Upload Custom Image',
      pleaseSelect: 'Please select celebrity background',
      selected: 'Selected',
      customDisabled: 'Celebrity background selection is disabled when using custom image',
      uploadImage: 'Upload Image',
      supportFormats: 'Support JPG, PNG formats',
      imageUploaded: 'Image uploaded',
      clickToReselect: 'Click to reselect',
      customImageSelected: 'Custom image selected',
      or: 'or'
    },
    zh: {
      selectCelebrity: '选择名人背景',
      uploadCustom: '上传本机图片',
      pleaseSelect: '请选择名人背景',
      selected: '已选择',
      customDisabled: '使用自定义图片时，名人背景选择被禁用',
      uploadImage: '上传图片',
      supportFormats: '支持 JPG、PNG 格式',
      imageUploaded: '图片已上传',
      clickToReselect: '点击可重新选择',
      customImageSelected: '已选择自定义图片',
      or: '或'
    },
    ja: {
      selectCelebrity: '有名人の背景を選択',
      uploadCustom: 'カスタム画像をアップロード',
      pleaseSelect: '有名人の背景を選択してください',
      selected: '選択済み',
      customDisabled: 'カスタム画像使用時は有名人背景選択が無効になります',
      uploadImage: '画像をアップロード',
      supportFormats: 'JPG、PNG形式をサポート',
      imageUploaded: '画像がアップロードされました',
      clickToReselect: 'クリックして再選択',
      customImageSelected: 'カスタム画像が選択されました',
      or: 'または'
    }
  };

  const t = languages[language] || languages.en;

  // 英/日显示的名人名称
  const heroNameI18n = {
    zh: {
      jobs: '乔布斯',
      luxun: '鲁迅',
      mayun: '马云',
      moyan: '莫言',
      musk: '马斯克',
      yuhua: '余华',
    },
    en: {
      jobs: 'Steve Jobs',
      luxun: 'Lu Xun',
      mayun: 'Jack Ma',
      moyan: 'Mo Yan',
      musk: 'Elon Musk',
      yuhua: 'Yu Hua',
    },
    ja: {
      jobs: 'スティーブ・ジョブズ',
      luxun: '魯迅',
      mayun: 'ジャック・マー',
      moyan: '莫言',
      musk: 'イーロン・マスク',
      yuhua: '余華',
    }
  };

  const getHeroDisplayName = (id) => {
    const map = heroNameI18n[language] || heroNameI18n.zh;
    return map[id] || id;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onCustomImageChange(e.target.result);
        onHeroChange(null); // 清空选中的英雄
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroSelect = (heroId) => {
    onHeroChange(heroId);
    onCustomImageChange(null); // 清空自定义图片
  };

  return (
    <div className="space-y-4">
      {/* 系统英雄选择 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          "text-gray-700 dark:text-gray-200"
        }`}>
          {t.selectCelebrity}
        </label>
        <div className="relative">
          <select
            value={selectedHero || ''}
            onChange={(e) => handleHeroSelect(e.target.value)}
            disabled={customImage}
            className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent appearance-none text-sm transition-all duration-200 ${
              customImage
                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500 dark:border-gray-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            <option value="">{t.pleaseSelect}</option>
            {heroes.map((hero) => (
              <option key={hero.id} value={hero.id}>
                {getHeroDisplayName(hero.id)}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-200 ${
            customImage ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
          }`} />
        </div>
        
        {/* 选择状态提示 */}
        {selectedHero && !customImage && (
          <div className={`mt-2 p-2 border rounded-lg transition-colors duration-300 ${
            "bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/10"
          }`}>
            <p className="text-sm font-medium">
              ✓ {t.selected} {getHeroDisplayName(selectedHero)}
            </p>
          </div>
        )}

        {customImage && (
          <div className={`mt-2 p-2 border rounded-lg transition-colors duration-300 ${
            "bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/10"
          }`}>
            <p className={`text-sm transition-colors duration-300 ${
              "text-gray-600 dark:text-gray-300"
            }`}>
              ℹ️ {t.customDisabled}
            </p>
          </div>
        )}
      </div>

      {/* 分割线 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full border-t transition-colors duration-300 ${
            "border-gray-200 dark:border-gray-600"
          }`} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={`px-2 transition-colors duration-300 ${
            "bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}>{t.or}</span>
        </div>
      </div>

      {/* 自定义图片上传 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          "text-gray-700 dark:text-gray-200"
        }`}>
          {t.uploadCustom}
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
            customImage
              ? 'border-neutral-900 bg-black/5 dark:border-white dark:bg-white/10'
              : 'border-gray-300 hover:border-gray-400 hover:bg-black/5 dark:border-gray-600 dark:hover:bg-white/5'
          }`}>
            {customImage ? (
              <div className="space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  "bg-neutral-900 dark:bg-white"
                }`}>
                  <Upload className={`w-8 h-8 ${"text-white dark:text-black"}`} />
                </div>
                <p className="text-sm font-semibold">{t.imageUploaded}</p>
                <p className={`text-xs transition-colors duration-300 ${
                  "text-gray-500 dark:text-gray-400"
                }`}>{t.clickToReselect}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  "bg-gray-100 dark:bg-gray-700"
                }`}>
                  <Upload className={`w-8 h-8 transition-colors duration-300 ${
                    "text-gray-400 dark:text-gray-400"
                  }`} />
                </div>
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  "text-gray-700 dark:text-gray-200"
                }`}>{t.uploadImage}</p>
                <p className={`text-xs transition-colors duration-300 ${
                  "text-gray-500 dark:text-gray-400"
                }`}>{t.supportFormats}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部当前选择提示（仅自定义图片时显示） */}
      {customImage && (
        <div className={`p-3 border rounded-lg transition-colors duration-300 ${
          "bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/10"
        }`}>
          <p className="text-sm font-medium">
            ✓ {t.customImageSelected}
          </p>
        </div>
      )}
    </div>
  );
};

export default HeroSelector;
