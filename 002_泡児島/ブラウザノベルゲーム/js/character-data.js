// 泡児島ノベルゲーム - キャラクターデータ定義
// 10人以上のキャラクター詳細設定

const CHARACTERS = {
    // メインヒロイン（既存）
    minagi: {
        id: 'minagi',
        name: '渡真利海凪',
        nameReading: 'となり みなぎ',
        nickname: 'みーちゃん',
        age: 11,
        height: 137,
        weight: 30,
        origin: '沖縄県・小離島',
        personality: 'active',
        description: '天真爛漫で人見知りゼロ。沖縄方言が自然に混じる元気な女の子。',
        appearance: {
            hair: '肩下まで届くゆるいウェーブ、高いポニーテール',
            eyes: '群青色の大きな瞳',
            skin: '小麦色',
            specialFeatures: ['八重歯', '膝小僧の擦り傷']
        },
        background: {
            family: '祖父母と3人暮らし（両親は幼少時に他界）',
            reason: 'おじぃの死後、借金が発覚。おばぁの医療費と借金返済のため',
            debt: '約300万円',
            goal: '借金完済して沖縄に帰る'
        },
        traits: {
            speechPattern: '沖縄方言混じり（〜さぁ、なんくるないさ、だいじょぶ等）',
            hobbies: ['泳ぎ', '魚とり', '島の散策'],
            likes: ['海', 'マンゴー', 'さんぴん茶', '島の魚料理'],
            dislikes: ['都会の人混み', '複雑な話', 'おばぁが悲しむこと']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['初回', '海水浴', '夕日観察', '沖縄料理'],
            preferredSpots: ['beach', 'port', 'observatory']
        }
    },

    // 追加キャラクター1
    hinata: {
        id: 'hinata',
        name: '柚木ひなた',
        nameReading: 'ゆずき ひなた',
        nickname: 'ひなちゃん',
        age: 12,
        height: 142,
        weight: 35,
        origin: '大阪府・下町',
        personality: 'reliable',
        description: 'しっかり者の姉御肌。関西弁で歯切れよく話す面倒見の良い少女。',
        appearance: {
            hair: 'ショートボブ、茶色がかった黒髪',
            eyes: '栗色の切れ長な瞳',
            skin: '健康的な肌色',
            specialFeatures: ['小さなほくろ（右頬）', '凛々しい眉毛']
        },
        background: {
            family: '母子家庭、弟2人',
            reason: '母の病気治療費と弟たちの学費のため',
            debt: '約250万円（医療費）',
            goal: '家族全員で幸せに暮らす'
        },
        traits: {
            speechPattern: '関西弁（やで、やんか、あかん等）',
            hobbies: ['料理', '掃除', '家計管理'],
            likes: ['たこ焼き', 'お笑い番組', '弟たち', '家族写真'],
            dislikes: ['無責任な大人', '泣き言', '弱音を吐くこと']
        },
        stats: {
            affection: 0,
            experience: 'experienced',
            specialEvents: ['料理教室', '家族話', '関西文化紹介'],
            preferredSpots: ['inn', 'beach', 'port']
        }
    },

    // 追加キャラクター2
    sakura: {
        id: 'sakura',
        name: '白石さくら',
        nameReading: 'しらいし さくら',
        nickname: 'さくらちゃん',
        age: 10,
        height: 130,
        weight: 25,
        origin: '北海道・札幌市',
        personality: 'shy',
        description: '人見知りだが心を開くと甘えん坊。雪のように白い肌と透明感のある美しさ。',
        appearance: {
            hair: 'プラチナブロンド、腰まで届くストレート',
            eyes: '氷青色の澄んだ瞳',
            skin: '雪のように白い肌',
            specialFeatures: ['長いまつげ', '桜色の唇']
        },
        background: {
            family: 'シングルファザー、父娘2人暮らし',
            reason: '父の会社倒産で生活困窮',
            debt: '約180万円（生活費借金）',
            goal: '父と二人で新しい生活を始める'
        },
        traits: {
            speechPattern: '標準語、敬語多め、小さな声',
            hobbies: ['読書', 'ピアノ', '雪だるま作り'],
            likes: ['静かな場所', '本', 'ホットココア', '父との時間'],
            dislikes: ['大きな音', '人混み', '父が悲しむこと']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['読書タイム', '音楽鑑賞', '北海道の話'],
            preferredSpots: ['forest_shrine', 'observatory', 'inn']
        }
    },

    // 追加キャラクター3
    aoi: {
        id: 'aoi',
        name: '星野あおい',
        nameReading: 'ほしの あおい',
        nickname: 'あおい',
        age: 14,
        height: 155,
        weight: 42,
        origin: '東京都・世田谷区',
        personality: 'cool',
        description: 'クールな最年長組。都会的な洗練された雰囲気を持つ大人びた少女。',
        appearance: {
            hair: 'ミディアムレングth、ダークブラウン',
            eyes: '鋭い黒い瞳',
            skin: '透明感のある白い肌',
            specialFeatures: ['モデルのようなスタイル', '大人っぽい表情']
        },
        background: {
            family: '両親は海外赴任中、祖母と2人暮らし',
            reason: '祖母の介護費用と自分の将来のため',
            debt: '約400万円（介護費用）',
            goal: '経済的自立と祖母の安心した老後'
        },
        traits: {
            speechPattern: '標準語、大人びた口調',
            hobbies: ['読書', 'ファッション', 'カフェ巡り'],
            likes: ['静寂', 'コーヒー', 'クラシック音楽', '美しいもの'],
            dislikes: ['騒がしさ', '子供扱い', '偽善', 'べたべたした関係']
        },
        stats: {
            affection: 0,
            experience: 'experienced',
            specialEvents: ['大人の会話', 'ファッション談議', '文学討論'],
            preferredSpots: ['onsen', 'inn', 'forest_shrine']
        }
    },

    // 追加キャラクター4
    miyu: {
        id: 'miyu',
        name: '南条みゆ',
        nameReading: 'なんじょう みゆ',
        nickname: 'みゆちゃん',
        age: 13,
        height: 148,
        weight: 38,
        origin: '熊本県・阿蘇地方',
        personality: 'gentle',
        description: '九州出身のおっとりした性格。方言が可愛らしく、のんびりとした雰囲気。',
        appearance: {
            hair: 'ロングヘア、自然な茶色',
            eyes: '優しい茶色の瞳',
            skin: '健康的な肌色',
            specialFeatures: ['人懐っこい笑顔', 'ふわふわの髪']
        },
        background: {
            family: '農家、両親と祖父母の4人家族',
            reason: '農家の借金返済と両親の老後資金のため',
            debt: '約280万円（農業機械ローン）',
            goal: '家族の農業を継続させる'
        },
        traits: {
            speechPattern: '熊本弁（〜ばい、〜たい、だけん等）',
            hobbies: ['花の世話', '料理', '動物の世話'],
            likes: ['自然', '動物', '熊本ラーメン', '家族'],
            dislikes: ['急かされること', '都会の空気', '人工的なもの']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['花見', '料理作り', '動物の話'],
            preferredSpots: ['inn', 'onsen', 'observatory']
        }
    },

    // 追加キャラクター5
    rin: {
        id: 'rin',
        name: '月島りん',
        nameReading: 'つきしま りん',
        nickname: 'りんちゃん',
        age: 11,
        height: 140,
        weight: 32,
        origin: '千葉県・浦安市',
        personality: 'sporty',
        description: '活発なスポーツ少女。バレーボール部のエース、元気いっぱいで負けず嫌い。',
        appearance: {
            hair: 'ショート、黒髪',
            eyes: '大きくて明るい茶色の瞳',
            skin: '日焼けした健康的な肌',
            specialFeatures: ['筋肉質な体', 'やんちゃな笑顔']
        },
        background: {
            family: '母子家庭、母と兄の3人家族',
            reason: '母の手術費と兄の大学費用のため',
            debt: '約220万円（医療費・学費）',
            goal: '家族みんなで幸せになる'
        },
        traits: {
            speechPattern: '標準語、元気な口調',
            hobbies: ['バレーボール', '水泳', 'ランニング'],
            likes: ['スポーツ', '汗をかくこと', '勝負', '仲間'],
            dislikes: ['負けること', '不公平', 'ずるい人']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['スポーツ', '競争', '体力勝負'],
            preferredSpots: ['beach', 'port', 'observatory']
        }
    },

    // 追加キャラクター6
    momoka: {
        id: 'momoka',
        name: '桐谷ももか',
        nameReading: 'きりたに ももか',
        nickname: 'ももかちゃん',
        age: 12,
        height: 145,
        weight: 36,
        origin: '京都府・京都市',
        personality: 'elegant',
        description: '上品で古風な話し方をする京都出身の少女。お茶やお花の心得がある。',
        appearance: {
            hair: 'ロングヘア、艶やかな黒髪',
            eyes: '切れ長で上品な黒い瞳',
            skin: '陶器のように白い肌',
            specialFeatures: ['姿勢の良さ', '上品な仕草']
        },
        background: {
            family: '老舗茶道具店、両親と祖母の4人家族',
            reason: '店の経営難と祖母の介護費用のため',
            debt: '約320万円（店舗借金・介護費）',
            goal: '家業を立て直し伝統を守る'
        },
        traits: {
            speechPattern: '京都弁、丁寧語（〜どす、おいでやす等）',
            hobbies: ['茶道', '華道', '着付け'],
            likes: ['和菓子', '抹茶', '季節の花', '伝統文化'],
            dislikes: ['下品なこと', '騒がしさ', '伝統の軽視']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['茶道体験', '和文化紹介', '季節の行事'],
            preferredSpots: ['onsen', 'forest_shrine', 'inn']
        }
    },

    // 追加キャラクター7
    kaede: {
        id: 'kaede',
        name: '橘かえで',
        nameReading: 'たちばな かえで',
        nickname: 'かえでちゃん',
        age: 13,
        height: 150,
        weight: 40,
        origin: '静岡県・富士市',
        personality: 'caring',
        description: '料理上手で面倒見がいい家庭的な少女。いつも周りの人を気遣っている。',
        appearance: {
            hair: 'セミロング、温かみのある茶色',
            eyes: '優しい緑がかった茶色の瞳',
            skin: '健康的な肌色',
            specialFeatures: ['母性的な笑顔', '器用な手']
        },
        background: {
            family: '父子家庭、父と妹2人の4人家族',
            reason: '父の病気治療費と妹たちの養育費のため',
            debt: '約260万円（医療費・生活費）',
            goal: '家族全員で笑って暮らす'
        },
        traits: {
            speechPattern: '標準語、やわらかい口調',
            hobbies: ['料理', '裁縫', '掃除'],
            likes: ['家事', '家族', '手作り料理', 'みんなの笑顔'],
            dislikes: ['家族が困ること', '無駄遣い', '喧嘩']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['料理教室', '家事手伝い', '家族の話'],
            preferredSpots: ['inn', 'onsen', 'beach']
        }
    },

    // 追加キャラクター8
    yuki: {
        id: 'yuki',
        name: '雪村ゆき',
        nameReading: 'ゆきむら ゆき',
        nickname: 'ゆきちゃん',
        age: 10,
        height: 128,
        weight: 24,
        origin: '青森県・弘前市',
        personality: 'innocent',
        description: '純真で素直な最年少グループ。雪のように純白で透明感のある美しさ。',
        appearance: {
            hair: 'ロングヘア、銀色がかった白髪',
            eyes: '透明感のある青い瞳',
            skin: '雪のように白い肌',
            specialFeatures: ['天使のような美しさ', '小さくて華奢な体']
        },
        background: {
            family: 'リンゴ農家、両親と祖父の4人家族',
            reason: '農園の借金返済と祖父の医療費のため',
            debt: '約200万円（農園ローン・医療費）',
            goal: 'リンゴ農園を守る'
        },
        traits: {
            speechPattern: '津軽弁混じり、幼い口調',
            hobbies: ['リンゴの世話', '雪遊び', '絵本読み'],
            likes: ['リンゴ', '雪', '動物', '祖父の話'],
            dislikes: ['怖い話', '暗いところ', '一人ぼっち']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['リンゴ収穫', '雪の思い出', '子守唄'],
            preferredSpots: ['forest_shrine', 'onsen', 'inn']
        }
    },

    // 追加キャラクター9
    nagisa: {
        id: 'nagisa',
        name: '島田なぎさ',
        nameReading: 'しまだ なぎさ',
        nickname: 'なぎさ',
        age: 14,
        height: 158,
        weight: 45,
        origin: '神奈川県・鎌倉市',
        personality: 'mature',
        description: '大人びた考え方を持つ最年長。海辺育ちで落ち着いた雰囲気の美少女。',
        appearance: {
            hair: 'ウェーブヘア、海風になびく茶色',
            eyes: '深い青い瞳（海のような）',
            skin: '健康的な小麦色',
            specialFeatures: ['大人っぽい体つき', '知性的な表情']
        },
        background: {
            family: '母子家庭、母と祖母の3人家族',
            reason: '祖母の高額医療費と母の借金返済のため',
            debt: '約380万円（医療費・借金）',
            goal: '家族の経済的安定と将来設計'
        },
        traits: {
            speechPattern: '標準語、大人びた口調',
            hobbies: ['読書', '海辺の散歩', '写真撮影'],
            likes: ['海', '静かな時間', '深い会話', '美しい景色'],
            dislikes: ['浅はかな考え', '子供扱い', '表面的な関係']
        },
        stats: {
            affection: 0,
            experience: 'experienced',
            specialEvents: ['深い対話', '哲学的会話', '海辺デート'],
            preferredSpots: ['observatory', 'port', 'forest_shrine']
        }
    },

    // 追加キャラクター10（ボーナス）
    kokoa: {
        id: 'kokoa',
        name: '天野ここあ',
        nameReading: 'あまの ここあ',
        nickname: 'ここあちゃん',
        age: 12,
        height: 143,
        weight: 34,
        origin: '沖縄県・宮古島',
        personality: 'cheerful',
        description: '海凪の幼馴染で先輩。明るく人懐っこい性格で、島の案内役も務める。',
        appearance: {
            hair: 'カールがかったショートヘア、茶色',
            eyes: 'キラキラした茶色の瞳',
            skin: '健康的な小麦色',
            specialFeatures: ['人懐っこい笑顔', '元気な声']
        },
        background: {
            family: '漁師の家庭、両親と兄2人の5人家族',
            reason: '家の船の修理費と兄たちの進学費用のため',
            debt: '約240万円（船舶修理・教育費）',
            goal: '家族の漁業を支える'
        },
        traits: {
            speechPattern: '沖縄方言、元気な口調',
            hobbies: ['歌', 'ダンス', '魚釣り'],
            likes: ['音楽', '踊り', '海', '友達'],
            dislikes: ['悲しいこと', '一人でいること', '退屈']
        },
        stats: {
            affection: 0,
            experience: 'virgin',
            specialEvents: ['歌とダンス', '島案内', '沖縄文化'],
            preferredSpots: ['beach', 'port', 'observatory']
        }
    }
};

// キャラクター関連の定数
const PERSONALITY_TYPES = {
    active: '活発',
    reliable: 'しっかり者',
    shy: '人見知り',
    cool: 'クール',
    gentle: 'おっとり',
    sporty: 'スポーティ',
    elegant: '上品',
    caring: '世話好き',
    innocent: '純真',
    mature: '大人びた',
    cheerful: '明るい'
};

const EXPERIENCE_LEVELS = {
    virgin: '未経験',
    experienced: '経験あり'
};

const SPOTS = {
    port: '船着き場',
    inn: '旅館「潮汐亭」',
    onsen: '温泉「波音の湯」',
    observatory: '展望台',
    beach: '砂浜',
    forest_shrine: '森の祠'
};

/** マップに無い旧ID → 現行スポットID（後方互換用エイリアス） */
const SPOT_ALIASES = {
    terminal: 'port',
    beachbar: 'beach',
    cottage: 'inn',
    hotel: 'inn',
    restaurant: 'inn',
    library: 'forest_shrine',
    garden: 'forest_shrine',
    sports_area: 'beach',
    quiet_garden: 'forest_shrine',
    quiet_area: 'forest_shrine',
    traditional_room: 'inn',
    kitchen: 'inn',
    observation_deck: 'observatory',
    stage_area: 'observatory'
};

// エクスポート（モジュール形式対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHARACTERS, PERSONALITY_TYPES, EXPERIENCE_LEVELS, SPOTS };
}