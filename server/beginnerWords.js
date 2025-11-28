const beginnerWords = [
    // Animals
    "dog", "cat", "bird", "fish", "frog", "bear", "lion", "deer", "duck", "goat",
    "cow", "pig", "hen", "fox", "wolf", "bat", "rat", "bee", "ant", "owl",
    
    // Food & Drink
    "apple", "bread", "milk", "egg", "cake", "pie", "tea", "coffee", "juice", "soup",
    "rice", "corn", "meat", "fish", "cheese", "pizza", "burger", "hot dog", "ice cream", "candy",
    
    // Household Items
    "chair", "table", "bed", "door", "window", "clock", "lamp", "phone", "book", "pen",
    "key", "box", "bag", "cup", "plate", "bowl", "fork", "spoon", "knife", "bottle",
    
    // Clothing
    "hat", "shoe", "sock", "coat", "shirt", "pants", "dress", "skirt", "belt", "tie",
    "glove", "scarf", "ring", "watch", "glasses", "purse", "wallet", "button", "zipper", "pocket",
    
    // Nature
    "tree", "flower", "grass", "leaf", "rock", "water", "fire", "sun", "moon", "star",
    "rain", "snow", "wind", "cloud", "storm", "river", "lake", "mountain", "beach", "sand",
    
    // People & Body
    "man", "woman", "child", "baby", "hand", "foot", "eye", "ear", "nose", "mouth",
    "hair", "face", "head", "heart", "bone", "teeth", "finger", "toe", "arm", "leg",
    
    // Transportation
    "car", "bus", "train", "plane", "boat", "ship", "bike", "truck", "taxi", "subway",
    "wheel", "engine", "road", "bridge", "street", "light", "signal", "parking", "garage", "highway",
    
    // Buildings & Places
    "house", "school", "store", "bank", "hospital", "hotel", "park", "zoo", "farm", "church",
    "kitchen", "bathroom", "bedroom", "garden", "pool", "office", "factory", "museum", "library", "theater",
    
    // Colors
    "red", "blue", "green", "yellow", "black", "white", "pink", "brown", "gray", "orange",
    "purple", "gold", "silver", "rainbow", "light", "dark", "bright", "pale", "deep", "neon",
    
    // Actions
    "run", "walk", "jump", "swim", "eat", "drink", "sleep", "read", "write", "draw",
    "sing", "dance", "play", "work", "talk", "laugh", "cry", "smile", "think", "dream",
    
    // Sports & Games
    "ball", "game", "sport", "team", "goal", "score", "player", "coach", "field", "court",
    "golf", "tennis", "soccer", "baseball", "basketball", "football", "hockey", "swimming", "running", "jumping",
    
    // Music
    "music", "song", "dance", "band", "guitar", "piano", "drum", "violin", "flute", "trumpet",
    "note", "sound", "voice", "choir", "concert", "radio", "headphones", "microphone", "speaker", "rhythm",
    
    // Weather
    "sunny", "rainy", "windy", "cloudy", "stormy", "snowy", "foggy", "hot", "cold", "warm",
    "weather", "temperature", "forecast", "umbrella", "jacket", "scarf", "glove", "heater", "fan", "air",
    
    // Time
    "time", "clock", "watch", "hour", "minute", "second", "day", "night", "week", "month",
    "year", "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "midnight", "dawn", "dusk",
    
    // Shapes
    "circle", "square", "triangle", "rectangle", "star", "heart", "diamond", "oval", "line", "dot",
    "shape", "size", "big", "small", "long", "short", "tall", "wide", "narrow", "round",
    
    // Emotions
    "happy", "sad", "angry", "scared", "surprised", "excited", "bored", "tired", "calm", "nervous",
    "love", "hate", "like", "dislike", "hope", "fear", "joy", "pain", "peace", "stress",
    
    // Compound Words (2-word phrases)
    "baseball", "basketball", "football", "volleyball", "handball", "snowball", "firefly", "butterfly", "dragonfly", "ladybug",
    "rainbow", "snowman", "sunflower", "moonlight", "starlight", "sunlight", "fireworks", "waterfall", "watermelon", "pineapple",
    "toothbrush", "hairbrush", "paintbrush", "toothpaste", "handshake", "handstand", "footprint", "football", "eyebrow", "eyelash",
    "doorbell", "doorknob", "keyboard", "keyhole", "notebook", "bookcase", "bookshelf", "bookmark", "bedroom", "bathroom",
    "living room", "dining room", "classroom", "waiting room", "post office", "police station", "fire station", "train station", "bus stop", "parking lot",
    "traffic light", "street light", "flashlight", "candlelight", "sunlight", "moonlight", "starlight", "spotlight", "headlight", "taillight",
    "swimming pool", "wading pool", "bird bath", "fish tank", "dog house", "tree house", "bird house", "mail box", "tool box", "lunch box",
    "garden hose", "water hose", "fire hose", "jump rope", "clothes line", "fishing line", "telephone line", "power line", "clothes pin", "safety pin",
    "paper clip", "hair clip", "chip clip", "rubber band", "hair band", "wedding band", "rock band", "jazz band", "marching band", "brass band",
    "tennis shoe", "dress shoe", "work shoe", "house shoe", "shoe lace", "shoe polish", "shoe store", "hat rack", "coat rack", "towel rack",
    "picture frame", "window frame", "door frame", "bed frame", "bike frame", "glasses case", "phone case", "pillow case", "book case", "display case",
    "alarm clock", "wall clock", "grand clock", "pocket watch", "wrist watch", "stop watch", "sun dial", "hour glass", "time piece", "calendar",
    "garden gate", "farm gate", "city gate", "iron gate", "wood gate", "fence post", "lamp post", "goal post", "bed post", "sign post",
    "tree trunk", "car trunk", "storage trunk", "tree branch", "bank branch", "family branch", "tree root", "plant root", "hair root", "square root",
    "bird nest", "mouse nest", "hair nest", "love nest", "bird egg", "chicken egg", "easter egg", "egg shell", "egg white", "egg yolk",
    "bee hive", "ant hill", "spider web", "bird wing", "airplane wing", "angel wing", "bird feather", "bird beak", "duck bill", "platypus bill",
    "cat paw", "dog paw", "bear paw", "lion paw", "tiger paw", "rabbit foot", "bird foot", "duck foot", "chicken foot", "horse hoof",
    "fish scale", "dragon scale", "music scale", "bath scale", "fish fin", "shark fin", "car fin", "airplane fin", "rocket fin", "swim fin",
    "snake skin", "animal skin", "human skin", "banana skin", "onion skin", "apple skin", "orange peel", "lemon peel", "potato peel", "carrot peel",
    "flower petal", "rose petal", "tulip petal", "daisy petal", "leaf stem", "flower stem", "wine glass", "water glass", "eye glass", "magnifying glass",
    "paper cup", "plastic cup", "coffee cup", "tea cup", "award cup", "sports cup", "paper plate", "plastic plate", "dinner plate", "license plate",
    "car door", "house door", "room door", "front door", "back door", "screen door", "glass door", "wood door", "metal door", "sliding door",
    "car window", "house window", "room window", "store window", "train window", "bus window", "plane window", "boat window", "eye window", "stained glass",
    "desk chair", "office chair", "dining chair", "rocking chair", "folding chair", "wheel chair", "high chair", "baby chair", "barber chair", "dentist chair",
    "kitchen table", "dining table", "coffee table", "picnic table", "pool table", "ping pong", "card table", "folding table", "work table", "operating table",
    "twin bed", "double bed", "queen bed", "king bed", "bunk bed", "folding bed", "hospital bed", "water bed", "air bed", "sofa bed",
    "night stand", "bed stand", "music stand", "news stand", "fruit stand", "ticket stand", "hot dog stand", "lemonade stand", "information stand", "display stand",
    "book shelf", "wall shelf", "floating shelf", "display shelf", "store shelf", "pantry shelf", "closet shelf", "bathroom shelf", "kitchen shelf", "garage shelf",
    "closet door", "cabinet door", "refrigerator door", "oven door", "microwave door", "dishwasher door", "washing machine", "dryer door", "car hood", "trunk hood",
    "kitchen sink", "bathroom sink", "bar sink", "utility sink", "kitchen counter", "bathroom counter", "store counter", "ticket counter", "lunch counter", "breakfast counter",
    "shower head", "sprinkler head", "flower bed", "vegetable bed", "river bank", "data bank", "blood bank", "piggy bank", "sand bank", "river bank",
    "ocean wave", "sound wave", "light wave", "radio wave", "heat wave", "cold wave", "shock wave", "tidal wave", "microwave", "earthquake wave",
    "mountain top", "hill top", "tree top", "building top", "ladder top", "stair top", "page top", "screen top", "list top", "chart top",
    "river bottom", "ocean bottom", "lake bottom", "pool bottom", "page bottom", "screen bottom", "list bottom", "chart bottom", "shoe bottom", "foot bottom",
    "forest edge", "cliff edge", "knife edge", "razor edge", "competitive edge", "cutting edge", "leading edge", "trailing edge", "outside edge", "inside edge",
    "city center", "town center", "shopping center", "community center", "sports center", "medical center", "data center", "call center", "nerve center", "control center",
    "school bus", "city bus", "tour bus", "party bus", "double bus", "shuttle bus", "mini bus", "big bus", "bus driver", "bus route",
    "train track", "race track", "running track", "audio track", "movie track", "album track", "single track", "double track", "railroad track", "monorail track",
    "airplane wing", "bird wing", "angel wing", "butterfly wing", "bat wing", "bee wing", "dragon wing", "airplane engine", "car engine", "train engine",
    "boat motor", "car motor", "electric motor", "gas motor", "outboard motor", "inboard motor", "motor boat", "motor cycle", "motor home", "motor scooter",
    "bike tire", "car tire", "truck tire", "bicycle tire", "motorcycle tire", "tractor tire", "spare tire", "flat tire", "puncture tire", "radial tire",
    "car wheel", "bike wheel", "train wheel", "ferris wheel", "paddle wheel", "steering wheel", "spinning wheel", "potter wheel", "water wheel", "gear wheel",
    "traffic sign", "road sign", "street sign", "stop sign", "yield sign", "warning sign", "information sign", "neon sign", "store sign", "billboard sign",
    "garden path", "forest path", "mountain path", "bike path", "walking path", "nature path", "stone path", "gravel path", "dirt path", "paved path",
    "city street", "main street", "side street", "one way street", "dead end street", "quiet street", "busy street", "narrow street", "wide street", "cobblestone street",
    "country road", "dirt road", "gravel road", "paved road", "mountain road", "coastal road", "forest road", "rural road", "urban road", "highway road",
    "wood bridge", "stone bridge", "iron bridge", "suspension bridge", "draw bridge", "covered bridge", "foot bridge", "railroad bridge", "highway bridge", "toll bridge",
    "street light", "traffic light", "stop light", "warning light", "signal light", "flash light", "head light", "tail light", "brake light", "turn signal",
    "power line", "telephone line", "fishing line", "clothes line", "finish line", "starting line", "assembly line", "product line", "fashion line", "air line",
    "garden fence", "wood fence", "chain fence", "barbed wire", "picket fence", "split rail", "privacy fence", "security fence", "border fence", "farm fence",
    "stone wall", "brick wall", "concrete wall", "garden wall", "retaining wall", "support wall", "city wall", "castle wall", "office wall", "bedroom wall",
    "house roof", "building roof", "car roof", "train roof", "bus roof", "flat roof", "sloped roof", "thatched roof", "tile roof", "metal roof",
    "front yard", "back yard", "school yard", "church yard", "farm yard", "court yard", "play yard", "storage yard", "rail yard", "lumber yard",
    "flower garden", "vegetable garden", "herb garden", "rose garden", "botanical garden", "community garden", "roof garden", "container garden", "water garden", "rock garden",
    "swing set", "play set", "dining set", "tea set", "tool set", "data set", "tv set", "movie set", "stage set", "chess set",
    "jump rope", "climb rope", "tie rope", "pull rope", "skip rope", "jump rope", "tow rope", "anchor rope", "safety rope", "rescue rope",
    "baseball bat", "cricket bat", "table tennis", "tennis racket", "badminton racket", "squash racket", "hockey stick", "golf club", "pool cue", "fishing rod",
    "toy car", "model car", "race car", "sports car", "family car", "work car", "police car", "fire truck", "ambulance", "taxi cab",
    "baby doll", "fashion doll", "rag doll", "paper doll", "action figure", "teddy bear", "stuffed animal", "plush toy", "wood toy", "plastic toy",
    "board game", "card game", "video game", "computer game", "puzzle game", "word game", "number game", "strategy game", "party game", "drinking game",
    "jigsaw puzzle", "crossword puzzle", "word search", "sudoku puzzle", "logic puzzle", "math puzzle", "picture puzzle", "3d puzzle", "rubik cube", "tangram puzzle",
    "art supply", "school supply", "office supply", "medical supply", "food supply", "water supply", "power supply", "air supply", "blood supply", "money supply",
    "paint brush", "hair brush", "tooth brush", "nail brush", "clothes brush", "wire brush", "pastry brush", "basting brush", "scrub brush", "makeup brush",
    "colored pencil", "graphite pencil", "mechanical pencil", "carpenter pencil", "eyebrow pencil", "lip pencil", "charcoal pencil", "watercolor pencil", "pastel pencil", "coloring pencil",
    "marker pen", "felt pen", "ballpoint pen", "fountain pen", "gel pen", "rollerball pen", "calligraphy pen", "digital pen", "space pen", "invisible pen",
    "writing paper", "printing paper", "drawing paper", "tissue paper", "wrapping paper", "toilet paper", "newspaper", "notebook paper", "graph paper", "construction paper",
    "school bag", "lunch bag", "grocery bag", "plastic bag", "paper bag", "shopping bag", "garbage bag", "sleeping bag", "beach bag", "diaper bag",
    "suit case", "brief case", "pencil case", "phone case", "glasses case", "jewelry case", "display case", "book case", "window case", "storage case",
    "tool box", "sewing kit", "first aid", "fishing tackle", "art kit", "science kit", "makeup kit", "shaving kit", "travel kit", "emergency kit"
  ];

module.exports = beginnerWords;
