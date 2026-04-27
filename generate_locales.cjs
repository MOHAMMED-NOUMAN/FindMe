const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi', 'te', 'mr', 'ta', 'bn'];

const translations = {
  en: {
    navbar: { home: 'Home', search: 'Search', report: 'Report', rescue: 'Rescue' },
    hero: { title: 'Find Missing Persons Faster', subtitle: 'AI-powered face matching and location tracking to reunite families during crises.', report_btn: 'Report Missing Person', search_btn: 'Search Database' },
    report_page: {
      title: 'Report Missing Person',
      subtitle: 'Please provide as much detail as you can. This helps us search faster.',
      step_person: 'Person Details',
      step_location: 'Last Seen',
      step_photos: 'Photos & Description',
      step_contact: 'Your Contact',
      submit: 'Submit Report',
      next: 'Next',
      back: 'Back',
      full_name: 'Full Name',
      age: 'Age (approximate)',
      gender: 'Gender',
      relationship: 'Your Relationship',
      last_seen: 'Last Seen Location',
      district: 'District / City',
      state: 'State',
      date_seen: 'Date Last Seen',
      time_seen: 'Approx. Time',
      upload: 'Upload Photo',
      physical_desc: 'Physical Description',
      phone: 'Your Phone Number',
      alt_phone: 'Alternate Contact (optional)',
      consent: 'I confirm the information provided is accurate and consent to sharing it with rescue authorities for the purpose of locating this person.'
    },
    search_page: {
      title: 'Search Missing Persons Database',
      placeholder: 'Search by name, district, or characteristics...',
      filter: 'Filter',
      no_results: 'No exact matches found.'
    }
  },
  hi: {
    navbar: { home: 'होम', search: 'खोजें', report: 'रिपोर्ट', rescue: 'बचाव' },
    hero: { title: 'लापता व्यक्तियों को तेज़ी से खोजें', subtitle: 'संकट के दौरान परिवारों को मिलाने के लिए एआई-आधारित चेहरा मिलान।', report_btn: 'लापता व्यक्ति की रिपोर्ट करें', search_btn: 'डेटाबेस खोजें' },
    report_page: {
      title: 'लापता व्यक्ति की रिपोर्ट करें',
      subtitle: 'कृपया अधिक से अधिक जानकारी दें। इससे हमें तेज़ी से खोजने में मदद मिलती है।',
      step_person: 'व्यक्ति का विवरण',
      step_location: 'अंतिम बार देखा गया',
      step_photos: 'तस्वीरें और विवरण',
      step_contact: 'आपका संपर्क',
      submit: 'रिपोर्ट जमा करें',
      next: 'अगला',
      back: 'पीछे',
      full_name: 'पूरा नाम',
      age: 'उम्र (अनुमानित)',
      gender: 'लिंग',
      relationship: 'आपका रिश्ता',
      last_seen: 'अंतिम बार देखा गया स्थान',
      district: 'जिला / शहर',
      state: 'राज्य',
      date_seen: 'देखे जाने की तारीख',
      time_seen: 'अनुमानित समय',
      upload: 'फोटो अपलोड करें',
      physical_desc: 'शारीरिक विवरण',
      phone: 'आपका फोन नंबर',
      alt_phone: 'वैकल्पिक संपर्क',
      consent: 'मैं पुष्टि करता हूँ कि दी गई जानकारी सही है और बचाव अधिकारियों के साथ साझा करने की सहमति देता हूँ।'
    },
    search_page: {
      title: 'लापता व्यक्तियों का डेटाबेस खोजें',
      placeholder: 'नाम, जिले या विशेषताओं से खोजें...',
      filter: 'फ़िल्टर',
      no_results: 'कोई सटीक मिलान नहीं मिला।'
    }
  },
  te: {
    navbar: { home: 'హోమ్', search: 'శోధన', report: 'నివేదిక', rescue: 'రక్షణ' },
    hero: { title: 'తప్పిపోయిన వారిని వేగంగా కనుగొనండి', subtitle: 'సంక్షోభ సమయంలో కుటుంబాలను కలపడానికి AI ఆధారిత ముఖ గుర్తింపు.', report_btn: 'తప్పిపోయిన వారి గురించి నివేదించండి', search_btn: 'డేటాబేస్ శోధించండి' },
    report_page: {
      title: 'తప్పిపోయిన వ్యక్తి గురించి నివేదించండి',
      subtitle: 'దయచేసి వీలైనంత ఎక్కువ వివరాలు ఇవ్వండి. ఇది వేగంగా శోధించడానికి సహాయపడుతుంది.',
      step_person: 'వ్యక్తి వివరాలు',
      step_location: 'చివరిగా చూసిన ప్రదేశం',
      step_photos: 'ఫోటోలు & వివరణ',
      step_contact: 'మీ సంప్రదింపు వివరాలు',
      submit: 'నివేదికను సమర్పించండి',
      next: 'తరువాత',
      back: 'వెనుకకు',
      full_name: 'పూర్తి పేరు',
      age: 'వయస్సు (సుమారు)',
      gender: 'లింగం',
      relationship: 'మీ బంధుత్వం',
      last_seen: 'చివరిగా చూసిన ప్రదేశం',
      district: 'జిల్లా / నగరం',
      state: 'రాష్ట్రం',
      date_seen: 'చివరిగా చూసిన తేదీ',
      time_seen: 'సుమారు సమయం',
      upload: 'ఫోటోను అప్‌లోడ్ చేయండి',
      physical_desc: 'శారీరక వివరణ',
      phone: 'మీ ఫోన్ నంబర్',
      alt_phone: 'ప్రత్యామ్నాయ సంప్రదింపు',
      consent: 'అందించిన సమాచారం ఖచ్చితమైనదని నేను ధృవీకరిస్తున్నాను మరియు రక్షణ అధికారులతో పంచుకోవడానికి అంగీకరిస్తున్నాను.'
    },
    search_page: {
      title: 'తప్పిపోయిన వ్యక్తుల డేటాబేస్ శోధించండి',
      placeholder: 'పేరు, జిల్లా లేదా లక్షణాల ద్వారా వెతకండి...',
      filter: 'ఫిల్టర్',
      no_results: 'ఖచ్చితమైన సరిపోలికలు కనుగొనబడలేదు.'
    }
  },
  mr: {
    navbar: { home: 'मुख्यपृष्ठ', search: 'शोधा', report: 'अहवाल', rescue: 'बचाव' },
    hero: { title: 'हरवलेल्या व्यक्तींना वेगाने शोधा', subtitle: 'संकटकाळात कुटुंबांची पुनर्भेट घडवण्यासाठी एआय-आधारित चेहरा ओळख.', report_btn: 'हरवलेल्या व्यक्तीचा अहवाल द्या', search_btn: 'डेटाबेस शोधा' },
    report_page: {
      title: 'हरवलेल्या व्यक्तीचा अहवाल द्या',
      subtitle: 'कृपया जास्तीत जास्त माहिती द्या. याने आम्हाला वेगाने शोधण्यास मदत होईल.',
      step_person: 'व्यक्तीचा तपशील',
      step_location: 'शेवटी कुठे पाहिले',
      step_photos: 'फोटो आणि वर्णन',
      step_contact: 'तुमचा संपर्क',
      submit: 'अहवाल जमा करा',
      next: 'पुढील',
      back: 'मागे',
      full_name: 'पूर्ण नाव',
      age: 'वय (अंदाजे)',
      gender: 'लिंग',
      relationship: 'तुमचे नाते',
      last_seen: 'शेवटी पाहिलेले ठिकाण',
      district: 'जिल्हा / शहर',
      state: 'राज्य',
      date_seen: 'पाहिल्याची तारीख',
      time_seen: 'अंदाजे वेळ',
      upload: 'फोटो अपलोड करा',
      physical_desc: 'शारीरिक वर्णन',
      phone: 'तुमचा फोन नंबर',
      alt_phone: 'पर्यायी संपर्क',
      consent: 'दिलेली माहिती अचूक असल्याची मी पुष्टी करतो आणि ती बचाव अधिकाऱ्यांसोबत शेअर करण्यास संमती देतो.'
    },
    search_page: {
      title: 'हरवलेल्या व्यक्तींचा डेटाबेस शोधा',
      placeholder: 'नाव, जिल्हा किंवा वैशिष्ट्यांद्वारे शोधा...',
      filter: 'फिल्टर',
      no_results: 'कोणतेही अचूक जुळणी आढळले नाही.'
    }
  },
  ta: {
    navbar: { home: 'முகப்பு', search: 'தேடல்', report: 'அறிக்கை', rescue: 'மீட்பு' },
    hero: { title: 'காணாமல் போனவர்களை விரைவாகக் கண்டறியவும்', subtitle: 'நெருக்கடி நேரத்தில் குடும்பங்களை ஒன்றிணைக்க AI முகப் பொருத்தம்.', report_btn: 'காணாமல் போனவர்களைப் பற்றி புகாரளிக்கவும்', search_btn: 'தரவுத்தளத்தைத் தேடவும்' },
    report_page: {
      title: 'காணாமல் போனவரைப் புகாரளிக்கவும்',
      subtitle: 'முடிந்தவரை அதிகமான விவரங்களை வழங்கவும். இது தேடலுக்கு உதவும்.',
      step_person: 'நபர் விவரங்கள்',
      step_location: 'கடைசியாக பார்த்த இடம்',
      step_photos: 'புகைப்படங்கள் & விளக்கம்',
      step_contact: 'உங்கள் தொடர்பு',
      submit: 'அறிக்கையைச் சமர்ப்பிக்கவும்',
      next: 'அடுத்து',
      back: 'பின்',
      full_name: 'முழு பெயர்',
      age: 'வயது (தோராயமாக)',
      gender: 'பாலினம்',
      relationship: 'உங்கள் உறவு',
      last_seen: 'கடைசியாக பார்த்த இடம்',
      district: 'மாவட்டம் / நகரம்',
      state: 'மாநிலம்',
      date_seen: 'கடைசியாக பார்த்த தேதி',
      time_seen: 'தோராயமான நேரம்',
      upload: 'புகைப்படத்தைப் பதிவேற்றவும்',
      physical_desc: 'உடல் விளக்கம்',
      phone: 'உங்கள் தொலைபேசி எண்',
      alt_phone: 'மாற்று தொடர்பு',
      consent: 'வழங்கப்பட்ட தகவல்கள் சரியானவை என்பதை நான் உறுதிப்படுத்துகிறேன்.'
    },
    search_page: {
      title: 'காணாமல் போனவர்களின் தரவுத்தளத்தைத் தேடவும்',
      placeholder: 'பெயர், மாவட்டம் அல்லது பண்புகள் மூலம் தேடவும்...',
      filter: 'வடிகட்டி',
      no_results: 'சரியான பொருத்தங்கள் எதுவும் கிடைக்கவில்லை.'
    }
  },
  bn: {
    navbar: { home: 'হোম', search: 'অনুসন্ধান', report: 'রিপোর্ট', rescue: 'উদ্ধার' },
    hero: { title: 'নিখোঁজ ব্যক্তিদের দ্রুত খুঁজুন', subtitle: 'সঙ্কটের সময় পরিবারগুলোকে পুনরায় একত্রিত করার জন্য এআই ভিত্তিক চেহারা মেলানো।', report_btn: 'নিখোঁজ ব্যক্তির রিপোর্ট করুন', search_btn: 'ডেটাবেস খুঁজুন' },
    report_page: {
      title: 'নিখোঁজ ব্যক্তির রিপোর্ট করুন',
      subtitle: 'দয়া করে যতটা সম্ভব বিস্তারিত তথ্য দিন। এটি দ্রুত খুঁজতে সাহায্য করবে।',
      step_person: 'ব্যক্তির বিবরণ',
      step_location: 'শেষবার দেখা গেছে',
      step_photos: 'ছবি এবং বিবরণ',
      step_contact: 'আপনার যোগাযোগ',
      submit: 'রিপোর্ট জমা দিন',
      next: 'পরবর্তী',
      back: 'পেছনে',
      full_name: 'পুরো নাম',
      age: 'বয়স (আনুমানিক)',
      gender: 'লিঙ্গ',
      relationship: 'আপনার সম্পর্ক',
      last_seen: 'শেষবার যেখানে দেখা গেছে',
      district: 'জেলা / শহর',
      state: 'রাজ্য',
      date_seen: 'দেখার তারিখ',
      time_seen: 'আনুমানিক সময়',
      upload: 'ছবি আপলোড করুন',
      physical_desc: 'শারীরিক বিবরণ',
      phone: 'আপনার ফোন নম্বর',
      alt_phone: 'বিকল্প যোগাযোগ',
      consent: 'আমি নিশ্চিত করছি যে প্রদত্ত তথ্য সঠিক এবং উদ্ধারকারী কর্তৃপক্ষের সাথে তা ভাগ করার সম্মতি দিচ্ছি।'
    },
    search_page: {
      title: 'নিখোঁজ ব্যক্তিদের ডেটাবেস খুঁজুন',
      placeholder: 'নাম, জেলা বা বৈশিষ্ট্য দ্বারা খুঁজুন...',
      filter: 'ফিল্টার',
      no_results: 'কোন সঠিক মিল পাওয়া যায়নি।'
    }
  }
};

locales.forEach(lang => {
  const dir = path.join(__dirname, 'public', 'locales', lang);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'translation.json'), JSON.stringify(translations[lang], null, 2));
});
console.log('Translations generated.');
