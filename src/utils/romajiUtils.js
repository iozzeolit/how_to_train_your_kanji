// Utility functions for Romaji conversion

// Hàm chuyển đổi hiragana và katakana sang romaji
export const hiraganaToRomaji = (text) => {
  // Tạo các nhóm từ kết hợp (2-3 ký tự) - ưu tiên kiểm tra trước
  const combinedMap = {
    // Hiragana kết hợp (yōon) - 2 ký tự
    きゃ: "kya",
    きゅ: "kyu",
    きょ: "kyo",
    しゃ: "sha",
    しゅ: "shu",
    しょ: "sho",
    ちゃ: "cha",
    ちゅ: "chu",
    ちょ: "cho",
    にゃ: "nya",
    にゅ: "nyu",
    にょ: "nyo",
    ひゃ: "hya",
    ひゅ: "hyu",
    ひょ: "hyo",
    みゃ: "mya",
    みゅ: "myu",
    みょ: "myo",
    りゃ: "rya",
    りゅ: "ryu",
    りょ: "ryo",
    ぎゃ: "gya",
    ぎゅ: "gyu",
    ぎょ: "gyo",
    じゃ: "ja",
    じゅ: "ju",
    じょ: "jo",
    びゃ: "bya",
    びゅ: "byu",
    びょ: "byo",
    ぴゃ: "pya",
    ぴゅ: "pyu",
    ぴょ: "pyo",

    // Katakana kết hợp (yōon) - 2 ký tự
    キャ: "kya",
    キュ: "kyu",
    キョ: "kyo",
    シャ: "sha",
    シュ: "shu",
    ショ: "sho",
    チャ: "cha",
    チュ: "chu",
    チョ: "cho",
    ニャ: "nya",
    ニュ: "nyu",
    ニョ: "nyo",
    ヒャ: "hya",
    ヒュ: "hyu",
    ヒョ: "hyo",
    ミャ: "mya",
    ミュ: "myu",
    ミョ: "myo",
    リャ: "rya",
    リュ: "ryu",
    リョ: "ryo",
    ギャ: "gya",
    ギュ: "gyu",
    ギョ: "gyo",
    ジャ: "ja",
    ジュ: "ju",
    ジョ: "jo",
    ビャ: "bya",
    ビュ: "byu",
    ビョ: "byo",
    ピャ: "pya",
    ピュ: "pyu",
    ピョ: "pyo",

    // Katakana mở rộng cho từ ngoại lai - 2 ký tự
    ファ: "fa",
    フィ: "fi",
    フェ: "fe",
    フォ: "fo",
    ウィ: "wi",
    ウェ: "we",
    ウォ: "wo",
    ヴァ: "va",
    ヴィ: "vi",
    ヴェ: "ve",
    ヴォ: "vo",
    シェ: "she",
    ジェ: "je",
    チェ: "che",
    ツァ: "tsa",
    ツィ: "tsi",
    ツェ: "tse",
    ツォ: "tso",
    ティ: "ti",
    トゥ: "tu",
    ディ: "di",
    ドゥ: "du",
    テュ: "tyu",
    デュ: "dyu",
    イェ: "ye",
  };

  // Từ đơn (1 ký tự) - kiểm tra sau
  const singleMap = {
    // Hiragana
    あ: "a",
    い: "i",
    う: "u",
    え: "e",
    お: "o",
    か: "ka",
    き: "ki",
    く: "ku",
    け: "ke",
    こ: "ko",
    が: "ga",
    ぎ: "gi",
    ぐ: "gu",
    げ: "ge",
    ご: "go",
    さ: "sa",
    し: "shi",
    す: "su",
    せ: "se",
    そ: "so",
    ざ: "za",
    じ: "ji",
    ず: "zu",
    ぜ: "ze",
    ぞ: "zo",
    た: "ta",
    ち: "chi",
    つ: "tsu",
    て: "te",
    と: "to",
    だ: "da",
    ぢ: "di",
    づ: "du",
    で: "de",
    ど: "do",
    な: "na",
    に: "ni",
    ぬ: "nu",
    ね: "ne",
    の: "no",
    は: "ha",
    ひ: "hi",
    ふ: "fu",
    へ: "he",
    ほ: "ho",
    ば: "ba",
    び: "bi",
    ぶ: "bu",
    べ: "be",
    ぼ: "bo",
    ぱ: "pa",
    ぴ: "pi",
    ぷ: "pu",
    ぺ: "pe",
    ぽ: "po",
    ま: "ma",
    み: "mi",
    む: "mu",
    め: "me",
    も: "mo",
    や: "ya",
    ゆ: "yu",
    よ: "yo",
    ら: "ra",
    り: "ri",
    る: "ru",
    れ: "re",
    ろ: "ro",
    わ: "wa",
    ゐ: "wi",
    ゑ: "we",
    を: "wo",
    ん: "n",
    ゃ: "ya",
    ゅ: "yu",
    ょ: "yo",
    っ: "tsu",

    // Katakana
    ア: "a",
    イ: "i",
    ウ: "u",
    エ: "e",
    オ: "o",
    カ: "ka",
    キ: "ki",
    ク: "ku",
    ケ: "ke",
    コ: "ko",
    ガ: "ga",
    ギ: "gi",
    グ: "gu",
    ゲ: "ge",
    ゴ: "go",
    サ: "sa",
    シ: "shi",
    ス: "su",
    セ: "se",
    ソ: "so",
    ザ: "za",
    ジ: "ji",
    ズ: "zu",
    ゼ: "ze",
    ゾ: "zo",
    タ: "ta",
    チ: "chi",
    ツ: "tsu",
    テ: "te",
    ト: "to",
    ダ: "da",
    ヂ: "di",
    ヅ: "du",
    デ: "de",
    ド: "do",
    ナ: "na",
    ニ: "ni",
    ヌ: "nu",
    ネ: "ne",
    ノ: "no",
    ハ: "ha",
    ヒ: "hi",
    フ: "fu",
    ヘ: "he",
    ホ: "ho",
    バ: "ba",
    ビ: "bi",
    ブ: "bu",
    ベ: "be",
    ボ: "bo",
    パ: "pa",
    ピ: "pi",
    プ: "pu",
    ペ: "pe",
    ポ: "po",
    マ: "ma",
    ミ: "mi",
    ム: "mu",
    メ: "me",
    モ: "mo",
    ヤ: "ya",
    ユ: "yu",
    ヨ: "yo",
    ラ: "ra",
    リ: "ri",
    ル: "ru",
    レ: "re",
    ロ: "ro",
    ワ: "wa",
    ヰ: "wi",
    ヱ: "we",
    ヲ: "wo",
    ン: "n",
    ャ: "ya",
    ュ: "yu",
    ョ: "yo",
    ッ: "tsu",
    ヴ: "vu",

    // Ký tự đặc biệt
    ー: "-",
    "・": ".",
  };

  let result = "";
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // Ưu tiên kiểm tra từ kết hợp (2 ký tự) trước
    if (i < text.length - 1) {
      const twoChar = text.slice(i, i + 2);
      if (combinedMap[twoChar]) {
        result += combinedMap[twoChar];
        i += 2;
        matched = true;
      }
    }

    // Nếu không tìm thấy từ kết hợp, kiểm tra từ đơn (1 ký tự)
    if (!matched) {
      const oneChar = text[i];
      if (singleMap[oneChar]) {
        result += singleMap[oneChar];
      } else {
        // Giữ nguyên ký tự nếu không tìm thấy trong bản đồ
        result += oneChar;
      }
      i += 1;
    }
  }

  return result;
};

// Hàm kiểm tra xem input có khớp với correct reading không (hỗ trợ romaji)
export const isReadingMatch = (userInput, correctReading, isRomajiMode) => {
  const normalizedUser = userInput.trim().toLowerCase();
  const normalizedCorrect = correctReading.trim().toLowerCase();

  if (isRomajiMode) {
    // Chuyển đổi correct reading (hiragana/katakana) sang romaji để so sánh
    const romajiCorrect = hiraganaToRomaji(normalizedCorrect);
    return normalizedUser === romajiCorrect;
  } else {
    // So sánh trực tiếp (hiragana/katakana)
    return normalizedUser === normalizedCorrect;
  }
};
