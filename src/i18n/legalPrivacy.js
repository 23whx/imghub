// Translations of the existing Chinese policy. No additional policies or dates.
const paragraph = (text, lead) => ({ type: 'paragraph', text, lead });
const heading = (text) => ({ type: 'heading', text });
const list = (...items) => ({ type: 'list', items });
const item = (lead, text) => ({ lead, text });

export const legalPrivacy = {
  en: [
    { title: '1. Overview', blocks: [
      paragraph('ImgHub ("we") takes your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.'),
      paragraph('All images you provide are processed locally in your browser and are not uploaded to our servers, unless a tool explicitly states that server processing is required, such as the webpage screenshot tool.', 'Core principle: '),
    ] },
    { title: '2. Information Collection', blocks: [
      heading('2.1 Information We Do Not Collect'),
      list('Image files you provide (processed locally in your browser)', 'Text you enter', 'Your personally identifiable information'),
      heading('2.2 Information We Collect Automatically'),
      list(item('Access logs: ', 'IP address, browser type, visit time, and pages visited'), item('Cookies: ', 'Used to save your language preference and theme settings (dark or light mode)'), item('Local storage: ', 'We use localStorage to save your preferences. This data is stored only on your device.')),
    ] },
    { title: '3. Use of Information', blocks: [
      paragraph('The limited information we collect is used only to:'),
      list('Provide and maintain our services', 'Improve the user experience', 'Analyze website usage', 'Prevent abuse and fraud'),
    ] },
    { title: '4. Third-Party Services', blocks: [
      heading('4.1 Google AdSense'),
      { type: 'paragraph', text: 'This website uses Google AdSense to display ads. Google may use cookies and web beacons to display personalized ads. You can manage your ad preferences by visiting ', link: { href: 'https://www.google.com/settings/ads', text: 'Google Ads Settings' }, tail: '.' },
      heading('4.2 Google Fonts'),
      paragraph('We use Google Fonts to improve font rendering. Use of Google Fonts is subject to Google’s privacy policy.'),
    ] },
    { title: '5. Data Security', blocks: [
      paragraph('We take reasonable technical and organizational measures to protect your information:'),
      list('Use HTTPS to encrypt data in transit', 'Process images locally without uploading them to a server', 'Regularly update security measures'),
    ] },
    { title: '6. Use of Cookies', blocks: [
      paragraph('We use the following types of cookies:'),
      list(item('Essential cookies: ', 'Support basic website functions'), item('Preference cookies: ', 'Remember your language and theme settings'), item('Analytics cookies: ', 'Help us understand website usage'), item('Advertising cookies: ', 'Support personalized ads provided by Google AdSense')),
      paragraph('You can manage or disable cookies through your browser settings, but this may affect website functionality.'),
    ] },
    { title: '7. Children’s Privacy', blocks: [
      paragraph('Our services are intended for users of all ages. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and discover that your child has provided personal information to us, please contact us.'),
    ] },
    { title: '8. Your Rights', blocks: [
      paragraph('You have the right to:'),
      list('Access the information we hold about you', 'Request correction of inaccurate information', 'Request deletion of your information', 'Object to or restrict certain data processing', 'Clear browser cookies and local storage at any time'),
    ] },
    { title: '9. Updates to This Privacy Policy', blocks: [
      paragraph('We may update this Privacy Policy from time to time. The updated policy will be posted on this page, and the “Last updated” date will be revised. We will notify you of significant changes prominently on the website.'),
    ] },
    { title: '10. Contact Us', blocks: [
      paragraph('If you have any questions or suggestions about this Privacy Policy, please contact us using the following details:'),
      { type: 'contact', emailLabel: 'Email: ', socialLabel: 'X (Twitter): ', siteLabel: 'Tool website: ' },
    ] },
    { title: '11. Governing Law', blocks: [
      paragraph('This Privacy Policy is governed by the laws of the People’s Republic of China. We are committed to complying with applicable data protection laws, including the Personal Information Protection Law.'),
    ] },
  ],
  ja: [
    { title: '1. 概要', blocks: [
      paragraph('ImgHub（以下「当サイト」）は、お客様のプライバシーを重視しています。本プライバシーポリシーでは、個人情報の収集、利用、保護について説明します。'),
      paragraph('お客様が読み込んだ画像はすべてブラウザ内で処理され、当サイトのサーバーには送信されません。ただし、「ウェブページのスクリーンショット」など、サーバーでの処理が必要であることを明示したツールは除きます。', '基本原則：'),
    ] },
    { title: '2. 情報の収集', blocks: [
      heading('2.1 収集しない情報'),
      list('お客様が読み込んだ画像ファイル（ブラウザ内で処理されます）', 'お客様が入力したテキスト', 'お客様個人を識別する情報'),
      heading('2.2 自動的に収集する情報'),
      list(item('アクセスログ：', 'IPアドレス、ブラウザの種類、アクセス日時、閲覧したページ'), item('Cookie：', '言語設定とテーマ設定（ダークモード・ライトモード）の保存に使用します'), item('ローカルストレージ：', 'localStorageを使用して設定を保存します。データはお客様の端末にのみ保存されます')),
    ] },
    { title: '3. 情報の利用', blocks: [
      paragraph('収集する限られた情報は、次の目的にのみ使用します。'),
      list('サービスの提供と維持', '使いやすさの改善', 'ウェブサイトの利用状況の分析', '不正利用や詐欺の防止'),
    ] },
    { title: '4. 第三者サービス', blocks: [
      heading('4.1 Google AdSense'),
      { type: 'paragraph', text: '当サイトではGoogle AdSenseを使用して広告を表示します。Googleは、パーソナライズド広告を表示するためにCookieやウェブビーコンを使用する場合があります。広告の設定は、', link: { href: 'https://www.google.com/settings/ads', text: 'Googleの広告設定' }, tail: 'から管理できます。' },
      heading('4.2 Google Fonts'),
      paragraph('当サイトでは、フォントをより適切に表示するためにGoogle Fontsを使用します。Google Fontsの利用には、Googleのプライバシーポリシーが適用されます。'),
    ] },
    { title: '5. データの安全性', blocks: [
      paragraph('お客様の情報を保護するため、合理的な技術的・組織的対策を講じています。'),
      list('HTTPSによる通信の暗号化', '画像をサーバーに送信せず、端末内で処理', '安全対策の定期的な更新'),
    ] },
    { title: '6. Cookieの利用', blocks: [
      paragraph('次の種類のCookieを使用します。'),
      list(item('必須Cookie：', 'ウェブサイトの基本機能に使用します'), item('設定Cookie：', '言語とテーマの設定を記憶します'), item('分析Cookie：', 'ウェブサイトの利用状況を把握するために使用します'), item('広告Cookie：', 'Google AdSenseによるパーソナライズド広告に使用します')),
      paragraph('ブラウザの設定からCookieを管理または無効にできます。ただし、ウェブサイトの機能に影響する場合があります。'),
    ] },
    { title: '7. 子どものプライバシー', blocks: [
      paragraph('当サイトのサービスは、あらゆる年齢の方を対象としています。13歳未満の子どもの個人情報を、意図的に収集することはありません。保護者の方が、お子様が当サイトに個人情報を提供したことに気づいた場合は、ご連絡ください。'),
    ] },
    { title: '8. お客様の権利', blocks: [
      paragraph('お客様には、次の権利があります。'),
      list('当サイトが保有する、ご自身に関する情報へのアクセス', '不正確な情報の訂正の請求', 'ご自身の情報の削除の請求', '特定のデータ処理への異議申し立て、または制限の請求', 'ブラウザのCookieとローカルストレージをいつでも削除すること'),
    ] },
    { title: '9. プライバシーポリシーの更新', blocks: [
      paragraph('本プライバシーポリシーは、随時更新する場合があります。更新したポリシーは本ページに掲載し、「最終更新日」を変更します。重要な変更がある場合は、ウェブサイトの目立つ場所でお知らせします。'),
    ] },
    { title: '10. お問い合わせ', blocks: [
      paragraph('本プライバシーポリシーに関するご質問やご意見は、次の連絡先までお寄せください。'),
      { type: 'contact', emailLabel: 'メール：', socialLabel: 'X (Twitter)：', siteLabel: 'ツールサイト：' },
    ] },
    { title: '11. 準拠法', blocks: [
      paragraph('本プライバシーポリシーには、中華人民共和国の法律が適用されます。当サイトは、「個人情報保護法」を含む、適用されるデータ保護法の遵守に努めます。'),
    ] },
  ],
};
