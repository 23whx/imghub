// Translations of the existing Chinese terms. The substance remains unchanged.
const paragraph = (text, lead) => ({ type: 'paragraph', text, lead });
const list = (...items) => ({ type: 'list', items });

export const legalTerms = {
  en: [
    { title: '1. Acceptance of Terms', blocks: [
      paragraph('Welcome to ImgHub! By accessing or using this website (the “Service”), you agree to these Terms of Service. If you do not agree to these terms, please do not use the Service.'),
    ] },
    { title: '2. Description of the Service', blocks: [
      paragraph('ImgHub is a free online image processing platform that provides the following tools:'),
      list('Subtitle screenshot generator', 'Pornhub-style logo maker', 'DND alignment grid', 'MBTI personality chart', 'Meme image slicer', 'Video thumbnail viewer', 'Image compression', 'Other tools that may be added in the future'),
    ] },
    { title: '3. License to Use', blocks: [
      paragraph('Subject to these terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal or commercial purposes.'),
      paragraph('You may:'),
      list('Use the Service to process images for which you hold the necessary rights', 'Download and save images you create', 'Use the Service for personal or commercial projects'),
    ] },
    { title: '4. Restrictions on Use', blocks: [
      paragraph('You agree not to:'),
      list('Use the Service to process illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable content', 'Upload files containing viruses, Trojan horses, or other malicious code', 'Attempt to gain unauthorized access to any part of the Service', 'Interfere with or disrupt the Service or its servers', 'Use automated tools, such as bots or crawlers, to access the Service excessively', 'Infringe the intellectual property or privacy rights of others', 'Use the Service for any unlawful purpose'),
    ] },
    { title: '5. User Content', blocks: [
      paragraph('You retain all rights to the content you upload to the Service. We do not claim any ownership of your content.', '5.1 Your rights: '),
      paragraph('Images you provide are primarily processed locally in your browser and are not permanently stored on our servers.', '5.2 Processing: '),
      paragraph('You are solely responsible for the content you upload. You warrant that you own or have obtained the necessary rights and permissions.', '5.3 Responsibility: '),
    ] },
    { title: '6. Intellectual Property', blocks: [
      paragraph('The Service and all its content, features, and functionality, including but not limited to information, software, text, displays, images, video, and audio, and their design, selection, and arrangement, are owned by Rollkey or its licensors and are protected by Chinese and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.'),
      paragraph('The ImgHub name and logo are trademarks of Rollkey and may not be used without written permission.'),
    ] },
    { title: '7. Disclaimer', blocks: [
      paragraph('The Service is provided on an “as is” and “as available” basis, without warranties of any kind, whether express or implied.', '7.1 Provided “as is”: '),
      paragraph('We do not warrant that the Service will:', '7.2 No guarantees: '),
      list('Be available at all times or operate without interruption', 'Be free of errors or completely secure', 'Meet your specific requirements', 'Produce accurate or reliable results'),
      paragraph('You use the Service at your own risk.', '7.3 Risks of use: '),
    ] },
    { title: '8. Limitation of Liability', blocks: [
      paragraph('To the fullest extent permitted by law, Rollkey and its suppliers, licensors, and distributors will not be liable for any indirect, incidental, special, consequential, or punitive damages; any loss of profits or revenue, whether incurred directly or indirectly; or any loss of data, use, goodwill, or other intangible losses.'),
    ] },
    { title: '9. Indemnification', blocks: [
      paragraph('You agree to defend, indemnify, and hold harmless Rollkey, its affiliates, officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs or debts, and expenses, including but not limited to attorneys’ fees, arising from:'),
      list('Your use or misuse of the Service', 'Your violation of these Terms of Service', 'Your infringement of any third party’s rights'),
    ] },
    { title: '10. Changes to and Termination of the Service', blocks: [
      paragraph('We reserve the right to modify or discontinue the Service, or any part of it, at any time, with or without notice.', '10.1 Our rights: '),
      paragraph('You may stop using the Service at any time.', '10.2 Your rights: '),
    ] },
    { title: '11. Third-Party Links', blocks: [
      paragraph('The Service may contain links to third-party websites or services that we do not own or control. We are not responsible for the content, privacy policies, or practices of any third-party websites or services.'),
    ] },
    { title: '12. Changes to the Terms', blocks: [
      paragraph('We reserve the right to change these terms at any time. The revised terms will be posted on this page, and the “Last updated” date will be revised. By continuing to use the Service after the terms are changed, you accept the revised terms.'),
    ] },
    { title: '13. Governing Law and Dispute Resolution', blocks: [
      paragraph('These terms are governed by and interpreted in accordance with the laws of the People’s Republic of China.', '13.1 Governing law: '),
      paragraph('Any dispute arising from these terms should first be resolved through friendly consultation between the parties. If consultation fails, either party may bring an action before a people’s court with jurisdiction.', '13.2 Dispute resolution: '),
    ] },
    { title: '14. Severability', blocks: [
      paragraph('If any provision of these terms is found invalid or unenforceable, that provision will be removed, and the remaining provisions will continue in effect.'),
    ] },
    { title: '15. Entire Agreement', blocks: [
      paragraph('These terms constitute the entire agreement between you and ImgHub regarding use of the Service and supersede all prior agreements and understandings.'),
    ] },
    { title: '16. Contact Us', blocks: [
      paragraph('If you have any questions about these Terms of Service, please contact us:'),
      { type: 'contact', emailLabel: 'Email: ', socialLabel: 'X (Twitter): ', siteLabel: 'Tool website: ' },
    ] },
  ],
  ja: [
    { title: '1. 利用規約への同意', blocks: [
      paragraph('ImgHubへようこそ。本ウェブサイト（以下「本サービス」）にアクセスする、または利用することにより、お客様は以下の利用規約に同意したものとします。同意いただけない場合は、本サービスを利用しないでください。'),
    ] },
    { title: '2. サービスの内容', blocks: [
      paragraph('ImgHubは、次の機能を提供する無料のオンライン画像処理ツールプラットフォームです。'),
      list('字幕付きスクリーンショットの作成', 'Pornhub風ロゴの作成', 'DNDアライメントの9マス表', 'MBTI性格タイプの画像作成', 'ミーム画像の分割', '動画サムネイルの表示', '画像圧縮', '今後追加される可能性のあるその他のツール'),
    ] },
    { title: '3. 利用許諾', blocks: [
      paragraph('本規約を遵守することを条件として、個人または商用の目的で本サービスにアクセスし、利用するための、限定的、非独占的、譲渡不可、撤回可能なライセンスをお客様に付与します。'),
      paragraph('お客様は、次のことを行えます。'),
      list('必要な権利を有する画像を、本サービスで処理すること', '作成した画像をダウンロードして保存すること', '個人または商用のプロジェクトで本サービスを利用すること'),
    ] },
    { title: '4. 利用上の制限', blocks: [
      paragraph('お客様は、次の行為を行わないことに同意するものとします。'),
      list('違法、有害、脅迫的、侮辱的、嫌がらせ、名誉毀損、下品、わいせつ、またはその他不快な内容を、本サービスで処理すること', 'ウイルス、トロイの木馬、その他の悪意あるコードを含むファイルをアップロードすること', '本サービスのいずれかの部分に、不正にアクセスしようとすること', '本サービスまたはサーバーを妨害、破壊すること', 'ボットやクローラーなどの自動化ツールで、本サービスに過剰にアクセスすること', '他者の知的財産権やプライバシー権を侵害すること', '違法な目的で本サービスを利用すること'),
    ] },
    { title: '5. ユーザーコンテンツ', blocks: [
      paragraph('お客様は、本サービスにアップロードしたすべてのコンテンツに関する権利を保持します。当サイトは、お客様のコンテンツの所有権を主張しません。', '5.1 お客様の権利：'),
      paragraph('お客様が読み込んだ画像は、主にブラウザ内で処理され、当サイトのサーバーに恒久的に保存されることはありません。', '5.2 処理方法：'),
      paragraph('アップロードしたコンテンツについては、お客様がすべての責任を負います。お客様は、必要な権利や許可を保有している、または取得済みであることを保証します。', '5.3 責任：'),
    ] },
    { title: '6. 知的財産権', blocks: [
      paragraph('本サービスおよびそのすべてのコンテンツ、機能、特性（情報、ソフトウェア、テキスト、表示、画像、動画、音声、ならびにそれらのデザイン、選択、配置を含みますが、これらに限りません）は、Rollkeyまたはそのライセンサーが所有し、中国および国際的な著作権、商標、特許、営業秘密、その他の知的財産権または所有権に関する法律によって保護されています。'),
      paragraph('ImgHubの名称とロゴはRollkeyの商標です。書面による許可なく使用することはできません。'),
    ] },
    { title: '7. 免責事項', blocks: [
      paragraph('本サービスは「現状有姿」および「提供可能な状態」で提供され、明示または黙示を問わず、いかなる保証も行いません。', '7.1 「現状有姿」での提供：'),
      paragraph('本サービスについて、次の事項を保証しません。', '7.2 保証の否認：'),
      list('常に利用可能であること、または中断なく動作すること', '不具合がないこと、または完全に安全であること', 'お客様の特定の要件を満たすこと', '正確または信頼できる結果を生成すること'),
      paragraph('本サービスは、お客様自身の責任において利用するものとします。', '7.3 利用に伴うリスク：'),
    ] },
    { title: '8. 責任の制限', blocks: [
      paragraph('法律で認められる最大限の範囲において、Rollkeyおよびその供給者、ライセンサー、販売者は、間接的、付随的、特別、結果的、懲罰的損害、直接または間接に生じる利益や収入の損失、データ、使用機会、信用、その他の無形の損失について責任を負いません。'),
    ] },
    { title: '9. 補償', blocks: [
      paragraph('お客様は、次の事項から生じるあらゆる請求、損害、義務、損失、責任、費用、債務、経費（弁護士費用を含みますが、これに限りません）について、Rollkey、その関連会社、役員、取締役、従業員、代理人を防御し、補償し、免責することに同意するものとします。'),
      list('お客様による本サービスの利用または不正利用', 'お客様による本利用規約への違反', 'お客様による第三者の権利の侵害'),
    ] },
    { title: '10. サービスの変更と終了', blocks: [
      paragraph('当サイトは、通知の有無を問わず、いつでも本サービスまたはその一部を変更または終了する権利を留保します。', '10.1 当サイトの権利：'),
      paragraph('お客様は、いつでも本サービスの利用を停止できます。', '10.2 お客様の権利：'),
    ] },
    { title: '11. 第三者へのリンク', blocks: [
      paragraph('本サービスには、当サイトが所有または管理していない第三者のウェブサイトやサービスへのリンクが含まれる場合があります。当サイトは、第三者のウェブサイトやサービスの内容、プライバシーポリシー、慣行について責任を負いません。'),
    ] },
    { title: '12. 規約の変更', blocks: [
      paragraph('当サイトは、いつでも本規約を変更する権利を留保します。変更後の規約は本ページに掲載し、「最終更新日」を変更します。規約の変更後も本サービスの利用を継続した場合、お客様は変更後の規約に同意したものとします。'),
    ] },
    { title: '13. 準拠法と紛争解決', blocks: [
      paragraph('本規約は、中華人民共和国の法律に準拠し、同法に従って解釈されます。', '13.1 準拠法：'),
      paragraph('本規約に関連して生じる紛争は、まず当事者間の友好的な協議によって解決するものとします。協議で解決できない場合、いずれの当事者も、管轄権を有する人民法院に訴訟を提起できます。', '13.2 紛争解決：'),
    ] },
    { title: '14. 分離可能性', blocks: [
      paragraph('本規約のいずれかの条項が無効または執行不能と判断された場合、その条項は削除され、残りの条項は引き続き有効とします。'),
    ] },
    { title: '15. 完全合意', blocks: [
      paragraph('本規約は、本サービスの利用に関するお客様とImgHubとの間の完全な合意を構成し、それ以前のすべての合意や了解に優先します。'),
    ] },
    { title: '16. お問い合わせ', blocks: [
      paragraph('本利用規約に関するご質問は、次の連絡先までお寄せください。'),
      { type: 'contact', emailLabel: 'メール：', socialLabel: 'X (Twitter)：', siteLabel: 'ツールサイト：' },
    ] },
  ],
};
