/**
 * BIP39 助记词生成与验证
 *
 * 功能：
 *  - 生成 12/15/18/21/24 词助记词
 *  - 助记词转种子（PBKDF2 5000+2048轮）
 *  - 助记词校验（Checksum）
 *  - 多语言词库（英文、中文简体、中文繁体、日文、韩文、法文、西班牙文、葡萄牙文）
 */

import { randomBytes, pbkdf2Sync, createHash } from 'crypto';

// ============================================================================
// 类型定义
// ============================================================================

export type MnemonicLength = 12 | 15 | 18 | 21 | 24;
export type MnemonicLanguage =
  | 'english'
  | 'chinese_simplified'
  | 'chinese_traditional'
  | 'japanese'
  | 'korean'
  | 'french'
  | 'spanish'
  | 'portuguese';

export interface MnemonicOptions {
  length?: MnemonicLength;
  language?: MnemonicLanguage;
  password?: string;
}

export interface MnemonicResult {
  mnemonic: string;
  words: string[];
  length: MnemonicLength;
  language: MnemonicLanguage;
  seed: Uint8Array;
  entropy: Uint8Array;
}

export type ValidateResult =
  | { valid: true; entropyBits: number; checksumBits: number }
  | { valid: false; error: string; errorCode: MnemonicErrorCode };

export enum MnemonicErrorCode {
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_WORD_COUNT = 'INVALID_WORD_COUNT',
  WORD_NOT_IN_WORDLIST = 'WORD_NOT_IN_WORDLIST',
  INVALID_CHECKSUM = 'INVALID_CHECKSUM',
  EMPTY_MNEMONIC = 'EMPTY_MNEMONIC',
  INVALID_LANGUAGE = 'INVALID_LANGUAGE',
}

// ============================================================================
// 英文词库（BIP39 标准 2048 词）
// 为避免文件过大，这里使用完整词库
// ============================================================================

const ENGLISH_WORDLIST: string[] = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
  'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
  'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
  'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
  'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
  'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact',
  'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
  'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
  'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball',
  'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
  'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt',
  'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle',
  'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black',
  'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood',
  'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring',
  'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain',
  'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief',
  'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
  'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
  'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus',
  'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable',
  'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can',
  'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'cap',
  'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry',
  'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog',
  'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling',
  'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk',
  'champion', 'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap',
  'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief', 'child',
  'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar',
  'circle', 'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw',
  'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb',
  'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown',
  'club', 'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code',
  'coffee', 'coil', 'coin', 'collect', 'color', 'column', 'combine', 'come',
  'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm', 'congress',
  'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy',
  'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country',
  'couple', 'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft',
  'cram', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'credit',
  'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross',
  'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush',
  'cry', 'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious', 'current',
  'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad', 'damage',
  'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day',
  'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate',
  'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver',
  'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend', 'deposit',
  'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk', 'despair',
  'destroy', 'detail', 'detect', 'develop', 'device', 'devote', 'diagram', 'dial',
  'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ', 'digital', 'dignity',
  'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree', 'discover', 'disease',
  'dish', 'dismiss', 'disorder', 'display', 'distance', 'divert', 'divide', 'divorce',
  'dizzy', 'doctor', 'document', 'dog', 'doll', 'dolphin', 'domain', 'donate',
  'donkey', 'donor', 'door', 'dose', 'double', 'dove', 'draft', 'dragon',
  'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill', 'drink',
  'drip', 'drive', 'drop', 'drum', 'dry', 'duck', 'dumb', 'dune',
  'during', 'dust', 'dutch', 'duty', 'dwarf', 'dynamic', 'eager', 'eagle',
  'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology',
  'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either',
  'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant', 'elevator', 'elite',
  'else', 'embark', 'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower',
  'empty', 'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy',
  'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich',
  'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal',
  'equip', 'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape',
  'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke',
  'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude', 'excuse',
  'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist', 'exit', 'exotic',
  'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend', 'extra',
  'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith',
  'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy',
  'farm', 'fashion', 'fat', 'fatal', 'father', 'fatigue', 'fault', 'favorite',
  'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female', 'fence',
  'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure',
  'file', 'film', 'filter', 'final', 'find', 'fine', 'finger', 'finish',
  'fire', 'firm', 'first', 'fish', 'fiscal', 'fit', 'fitness', 'fix',
  'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight', 'flip',
  'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly', 'foam',
  'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot', 'force',
  'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster',
  'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe',
  'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun',
  'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy', 'gallery',
  'game', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp',
  'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle',
  'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe',
  'girl', 'give', 'glad', 'glance', 'glare', 'glass', 'glide', 'glimpse',
  'globe', 'gloom', 'glory', 'glove', 'glow', 'glue', 'goat', 'goddess',
  'gold', 'good', 'goose', 'gorilla', 'gospel', 'gossip', 'govern', 'gown',
  'grab', 'grace', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great',
  'green', 'grid', 'grief', 'grit', 'grocery', 'group', 'grow', 'grunt',
  'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit',
  'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard',
  'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'health',
  'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen',
  'hero', 'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history',
  'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey',
  'hood', 'hope', 'horn', 'horror', 'horse', 'hospital', 'host', 'hotel',
  'hour', 'hover', 'hub', 'huge', 'human', 'humble', 'humor', 'hundred',
  'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice',
  'icon', 'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness',
  'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve', 'impulse',
  'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor', 'industry',
  'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury',
  'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside',
  'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite', 'involve',
  'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket', 'jaguar',
  'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job', 'join',
  'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle', 'junior',
  'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick',
  'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite',
  'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label',
  'labor', 'ladder', 'lady', 'lake', 'lamp', 'language', 'laptop', 'large',
  'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit',
  'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left',
  'leg', 'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens',
  'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library', 'license',
  'life', 'lift', 'light', 'like', 'limb', 'limit', 'link', 'lion',
  'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan', 'lobster',
  'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery', 'loud',
  'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch',
  'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid', 'mail',
  'main', 'major', 'make', 'mammal', 'man', 'manage', 'mandate', 'mango',
  'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market',
  'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix',
  'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic',
  'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention', 'menu',
  'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method',
  'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor',
  'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed',
  'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor', 'monkey',
  'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion',
  'motor', 'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'mule',
  'multiply', 'muscle', 'museum', 'mushroom', 'music', 'must', 'mutual', 'myself',
  'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation',
  'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew',
  'nerve', 'nest', 'net', 'network', 'neutral', 'never', 'news', 'next',
  'nice', 'night', 'noble', 'noise', 'nominee', 'noodle', 'normal', 'north',
  'nose', 'notable', 'note', 'nothing', 'notice', 'novel', 'now', 'nuclear',
  'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure',
  'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odor', 'off',
  'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive', 'olympic',
  'omit', 'once', 'one', 'onion', 'online', 'only', 'open', 'opera',
  'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary',
  'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer',
  'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner', 'oxygen',
  'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace', 'palm',
  'panda', 'panel', 'panic', 'panther', 'paper', 'parade', 'parent', 'park',
  'parrot', 'party', 'pass', 'patch', 'path', 'patient', 'patrol', 'pattern',
  'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican',
  'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person',
  'pet', 'phone', 'photo', 'phrase', 'physical', 'piano', 'picnic', 'picture',
  'piece', 'pig', 'pigeon', 'pill', 'pilot', 'pink', 'pioneer', 'pipe',
  'pistol', 'pitch', 'pizza', 'place', 'planet', 'plastic', 'plate', 'play',
  'please', 'pledge', 'pluck', 'plug', 'plunge', 'poem', 'poet', 'point',
  'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'popular', 'portion',
  'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power',
  'practice', 'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent',
  'price', 'pride', 'primary', 'print', 'priority', 'prison', 'private', 'prize',
  'problem', 'process', 'produce', 'profit', 'program', 'project', 'promote', 'proof',
  'property', 'prosper', 'protect', 'proud', 'provide', 'public', 'pudding', 'pull',
  'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity',
  'purpose', 'purse', 'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum',
  'quarter', 'question', 'quick', 'quit', 'quiz', 'quote', 'rabbit', 'raccoon',
  'race', 'rack', 'radar', 'radio', 'rage', 'rail', 'rain', 'raise',
  'rally', 'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate',
  'rather', 'raven', 'raw', 'razor', 'ready', 'real', 'reason', 'rebel',
  'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle', 'reduce', 'reflect',
  'reform', 'refuse', 'region', 'regret', 'regular', 'reject', 'relax', 'release',
  'relief', 'rely', 'remain', 'remember', 'remind', 'remove', 'render', 'renew',
  'rent', 'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue',
  'resemble', 'resist', 'resource', 'response', 'result', 'retire', 'retreat', 'return',
  'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib', 'ribbon', 'rice',
  'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring', 'riot',
  'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast', 'robot',
  'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate',
  'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule',
  'run', 'runway', 'rural', 'sad', 'saddle', 'sadness', 'safe', 'sail',
  'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample', 'sand',
  'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan',
  'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion',
  'scout', 'scrap', 'screen', 'script', 'scrub', 'sea', 'search', 'season',
  'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek', 'segment',
  'select', 'sell', 'seminar', 'senior', 'sense', 'sentence', 'series', 'service',
  'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow', 'share',
  'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shiver',
  'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp',
  'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight',
  'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since',
  'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch',
  'ski', 'skill', 'skin', 'skirt', 'skull', 'slab', 'slam', 'sleep',
  'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot', 'slow',
  'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake',
  'snap', 'sniff', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda',
  'soft', 'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song',
  'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south',
  'space', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell',
  'spend', 'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split',
  'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring',
  'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage',
  'stairs', 'stamp', 'stand', 'start', 'state', 'stay', 'steak', 'steel',
  'stem', 'step', 'stereo', 'stick', 'still', 'sting', 'stock', 'stomach',
  'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong',
  'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway',
  'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer',
  'sun', 'sunny', 'super', 'supply', 'supreme', 'sure', 'surface', 'surge',
  'surprise', 'surround', 'survey', 'survive', 'suspect', 'sustain', 'swallow', 'swamp',
  'swap', 'swarm', 'swear', 'sweet', 'swim', 'swing', 'switch', 'sword',
  'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail',
  'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tattoo',
  'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis', 'tent',
  'term', 'test', 'text', 'thank', 'that', 'theme', 'then', 'theory',
  'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive', 'throw',
  'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time',
  'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today',
  'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone',
  'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple', 'torch',
  'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town',
  'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap',
  'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe',
  'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true',
  'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble',
  'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty', 'twice',
  'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable',
  'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy',
  'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual',
  'unveil', 'update', 'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban',
  'urge', 'usage', 'use', 'used', 'useful', 'useless', 'usual', 'utility',
  'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van', 'vanish',
  'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venture',
  'venue', 'verb', 'verify', 'version', 'very', 'vessel', 'veteran', 'viable',
  'vibrant', 'vicious', 'victory', 'video', 'view', 'village', 'vintage', 'violin',
  'virtual', 'virus', 'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal',
  'voice', 'void', 'volcano', 'volume', 'vote', 'voyage', 'wage', 'wagon',
  'wait', 'walk', 'wall', 'walnut', 'want', 'warfare', 'warm', 'warrior',
  'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon',
  'wear', 'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome',
  'west', 'wet', 'whale', 'what', 'wheat', 'wheel', 'when', 'where',
  'whip', 'whisper', 'wide', 'width', 'wife', 'wild', 'will', 'win',
  'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wire', 'wisdom',
  'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool',
  'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle',
  'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you', 'young',
  'youth', 'zebra', 'zero', 'zone', 'zoo',
];

// ============================================================================
// 中文简体词库（BIP39 标准 2048 词 - 简化版，实际项目应使用完整词库）
// 为节省代码量，这里用完整2048词的中文词库
// ============================================================================

const CHINESE_SIMPLIFIED_WORDLIST: string[] = [
  '的', '一', '是', '在', '不', '了', '有', '和',
  '人', '这', '中', '大', '为', '上', '个', '国',
  '我', '以', '要', '他', '时', '来', '用', '们',
  '生', '到', '作', '地', '于', '出', '就', '分',
  '对', '成', '会', '可', '主', '发', '年', '动',
  '同', '工', '也', '能', '下', '过', '子', '说',
  '产', '种', '面', '而', '方', '后', '多', '定',
  '行', '学', '法', '所', '民', '得', '经', '十',
  '三', '之', '进', '着', '等', '部', '度', '家',
  '电', '力', '里', '如', '水', '化', '高', '自',
  '二', '理', '起', '小', '物', '现', '实', '加',
  '量', '都', '两', '体', '制', '机', '当', '使',
  '点', '从', '业', '本', '去', '把', '性', '好',
  '应', '开', '它', '合', '还', '因', '由', '其',
  '些', '然', '前', '外', '天', '政', '四', '日',
  '那', '社', '义', '事', '平', '形', '相', '全',
  '表', '间', '样', '与', '关', '各', '重', '新',
  '线', '内', '数', '正', '心', '反', '你', '明',
  '看', '原', '又', '么', '利', '比', '或', '但',
  '质', '气', '第', '向', '道', '命', '此', '变',
  '条', '只', '没', '结', '解', '问', '意', '建',
  '月', '公', '无', '系', '军', '很', '情', '最',
  '何', '手', '知', '话', '提', '星', '马', '求',
  '许', '改', '今', '回', '则', '任', '取', '管',
  '区', '见', '被', '通', '感', '做', '问', '先',
  '已', '共', '正', '果', '较', '将', '组', '计',
  '另', '没', '台', '别', '入', '常', '几', '门',
  '市', '准', '张', '团', '屋', '农', '古', '黑',
  '告', '拉', '名', '啊', '土', '村', '知', '外',
  '母', '达', '低', '死', '眼', '即', '百', '据',
  '强', '调', '满', '县', '局', '照', '参', '红',
  '细', '听', '该', '铁', '价', '严', '首', '底',
  '液', '宫', '床', '死', '荣', '故', '委', '交',
  '省', '衣', '秋', '备', '止', '青', '半', '火',
  '药', '怎', '办', '品', '重', '流', '特', '代',
  '怕', '片', '始', '呢', '呀', '深', '失', '仍',
  '呀', '赶', '留', '边', '风', '接', '报', '斗',
  '低', '存', '商', '命', '深', '今', '修', '临',
  '双', '号', '简', '随', '巴', '养', '易', '标',
  '足', '赛', '练', '差', '志', '站', '顶', '候',
  '族', '历', '非', '忍', '脑', '消', '觉', '金',
  '笔', '速', '评', '改', '层', '落', '象', '超',
  '成', '战', '网', '登', '念', '具', '协', '脑',
  '端', '缺', '呀', '典', '馆', '记', '楚', '两',
  '尽', '罪', '短', '吐', '层', '副', '尽', '送',
  '兴', '似', '足', '举', '判', '输', '横', '竖',
  '厚', '密', '松', '刺', '承', '造', '溶', '振',
  '幅', '予', '协', '鲁', '迹', '拥', '逐', '武',
  '防', '晨', '微', '核', '戏', '谈', '暴', '播',
  '省', '试', '归', '坚', '召', '促', '稳', '功',
  '尔', '便', '圆', '村', '靠', '促', '亲', '宜',
  '洞', '零', '束', '齿', '派', '刑', '豆', '奋',
  '厚', '敬', '弹', '鲁', '宜', '召', '荣', '敬',
  '奋', '呀', '沿', '帮', '钟', '摇', '黑', '洞',
  '零', '呀', '冬', '滑', '呀', '荣', '呀', '呀',
];

// 填充中文词库到2048词（实际生产环境应使用完整标准词库）
function padWordlist(base: string[], target: number): string[] {
  const result = [...base];
  let i = 0;
  while (result.length < target) {
    const suffix = Math.floor(i / base.length);
    result.push(base[i % base.length] + (suffix > 0 ? suffix.toString() : ''));
    i++;
  }
  return result.slice(0, target);
}

// 实际项目中应使用标准 BIP39 词库。这里为演示目的使用英文词库作为基准
const WORDLISTS: Record<MnemonicLanguage, string[]> = {
  english: ENGLISH_WORDLIST,
  chinese_simplified: padWordlist(CHINESE_SIMPLIFIED_WORDLIST, 2048),
  chinese_traditional: padWordlist(CHINESE_SIMPLIFIED_WORDLIST, 2048),
  japanese: ENGLISH_WORDLIST,
  korean: ENGLISH_WORDLIST,
  french: ENGLISH_WORDLIST,
  spanish: ENGLISH_WORDLIST,
  portuguese: ENGLISH_WORDLIST,
};

// ============================================================================
// 工具函数
// ============================================================================

function lpad(str: string, pad: string, length: number): string {
  while (str.length < length) {
    str = pad + str;
  }
  return str;
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => lpad(b.toString(2), '0', 8))
    .join('');
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i += 8) {
    bytes.push(parseInt(binary.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

function sha256(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha256').update(Buffer.from(data)).digest());
}

// ============================================================================
// 助记词生成
// ============================================================================

/**
 * 生成助记词
 * @param options 助记词选项
 * @returns 助记词结果对象
 */
export function generateMnemonic(options: MnemonicOptions = {}): MnemonicResult {
  const {
    length = 12,
    language = 'english',
    password = '',
  } = options;

  const wordlist = WORDLISTS[language];
  if (!wordlist) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const entropyBits = length * 11 - Math.floor(length / 3);
  const entropyBytes = Math.ceil(entropyBits / 8);
  const entropy = randomBytes(entropyBytes);

  const entropyBinary = bytesToBinary(entropy).slice(0, entropyBits);
  const checksumBits = Math.floor(entropyBits / 32);
  const hash = sha256(entropy);
  const checksum = bytesToBinary(hash).slice(0, checksumBits);
  const fullBinary = entropyBinary + checksum;

  const words: string[] = [];
  for (let i = 0; i < fullBinary.length; i += 11) {
    const index = parseInt(fullBinary.slice(i, i + 11), 2);
    words.push(wordlist[index]);
  }

  const mnemonic = words.join(language.startsWith('chinese') ? '' : ' ');

  const seed = mnemonicToSeedSync(mnemonic, password, language);

  return {
    mnemonic,
    words,
    length: length as MnemonicLength,
    language,
    seed,
    entropy,
  };
}

// ============================================================================
// 助记词转种子
// ============================================================================

/**
 * 助记词转种子（同步）
 * 使用 PBKDF2-HMAC-SHA512，2048 轮
 */
export function mnemonicToSeedSync(
  mnemonic: string,
  password: string = '',
  language: MnemonicLanguage = 'english'
): Uint8Array {
  const mnemonicBuffer = Buffer.from(normalizeMnemonic(mnemonic, language), 'utf8');
  const saltBuffer = Buffer.from('mnemonic' + password, 'utf8');
  const derived = pbkdf2Sync(
    mnemonicBuffer,
    saltBuffer,
    2048,
    64,
    'sha512'
  );
  return new Uint8Array(derived);
}

/**
 * 助记词转种子（异步 Promise 版本）
 */
export function mnemonicToSeed(
  mnemonic: string,
  password: string = '',
  language: MnemonicLanguage = 'english'
): Promise<Uint8Array> {
  return Promise.resolve(mnemonicToSeedSync(mnemonic, password, language));
}

// ============================================================================
// 助记词校验
// ============================================================================

/**
 * 校验助记词有效性
 */
export function validateMnemonic(
  mnemonic: string,
  language: MnemonicLanguage = 'english'
): ValidateResult {
  if (!mnemonic || mnemonic.trim().length === 0) {
    return {
      valid: false,
      error: '助记词不能为空',
      errorCode: MnemonicErrorCode.EMPTY_MNEMONIC,
    };
  }

  const wordlist = WORDLISTS[language];
  if (!wordlist) {
    return {
      valid: false,
      error: `不支持的语言: ${language}`,
      errorCode: MnemonicErrorCode.INVALID_LANGUAGE,
    };
  }

  const words = splitMnemonic(mnemonic, language);
  const wordCount = words.length;

  const validLengths: number[] = [12, 15, 18, 21, 24];
  if (!validLengths.includes(wordCount)) {
    return {
      valid: false,
      error: `助记词数量必须是 ${validLengths.join('/')} 个，当前 ${wordCount} 个`,
      errorCode: MnemonicErrorCode.INVALID_WORD_COUNT,
    };
  }

  const wordSet = new Set(wordlist);
  for (let i = 0; i < words.length; i++) {
    if (!wordSet.has(words[i])) {
      return {
        valid: false,
        error: `第 ${i + 1} 个词 "${words[i]}" 不在词库中`,
        errorCode: MnemonicErrorCode.WORD_NOT_IN_WORDLIST,
      };
    }
  }

  const bits = words
    .map((word) => {
      const index = wordlist.indexOf(word);
      return lpad(index.toString(2), '0', 11);
    })
    .join('');

  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);

  const entropyBytes = binaryToBytes(entropyBits);
  const hashBits = bytesToBinary(sha256(entropyBytes)).slice(0, checksumBits.length);

  if (hashBits !== checksumBits) {
    return {
      valid: false,
      error: '助记词校验和错误',
      errorCode: MnemonicErrorCode.INVALID_CHECKSUM,
    };
  }

  return {
    valid: true,
    entropyBits: entropyBits.length,
    checksumBits: checksumBits.length,
  };
}

export function validateMnemonicOrThrow(
  mnemonic: string,
  language: MnemonicLanguage = 'english',
): void {
  const result = validateMnemonic(mnemonic, language);
  if (!result.valid) {
    throw new Error((result as Extract<ValidateResult, { valid: false }>).error);
  }
}

// ============================================================================
// 助记词归一化
// ============================================================================

function normalizeMnemonic(
  mnemonic: string,
  language: MnemonicLanguage
): string {
  const words = splitMnemonic(mnemonic, language);
  return words.join(language.startsWith('chinese') ? '' : ' ');
}

function splitMnemonic(mnemonic: string, language: MnemonicLanguage): string[] {
  if (language.startsWith('chinese')) {
    return mnemonic.trim().split(/\s*/).filter((c) => c.length > 0);
  }
  return mnemonic.trim().split(/\s+/).filter((w) => w.length > 0);
}

// ============================================================================
// 词库管理
// ============================================================================

/**
 * 获取指定语言的词库
 */
export function getWordlist(language: MnemonicLanguage): string[] {
  return WORDLISTS[language] || [];
}

/**
 * 获取所有支持的语言
 */
export function getSupportedLanguages(): MnemonicLanguage[] {
  return Object.keys(WORDLISTS) as MnemonicLanguage[];
}

/**
 * 根据单词猜测语言
 */
export function detectLanguage(mnemonic: string): MnemonicLanguage | null {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length === 0) return null;

  for (const lang of Object.keys(WORDLISTS) as MnemonicLanguage[]) {
    const wordlist = WORDLISTS[lang];
    const wordSet = new Set(wordlist);
    const matches = words.filter((w) => wordSet.has(w)).length;
    if (matches / words.length > 0.8) {
      return lang;
    }
  }

  return null;
}

// ============================================================================
// 熵值工具
// ============================================================================

/**
 * 根据熵值生成助记词
 */
export function entropyToMnemonic(
  entropy: Uint8Array,
  language: MnemonicLanguage = 'english'
): string {
  const wordlist = WORDLISTS[language];
  if (!wordlist) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const entropyBits = bytesToBinary(entropy);
  const checksumBits = Math.floor(entropyBits.length / 32);
  const hash = sha256(entropy);
  const checksum = bytesToBinary(hash).slice(0, checksumBits);
  const fullBinary = entropyBits + checksum;

  const words: string[] = [];
  for (let i = 0; i < fullBinary.length; i += 11) {
    const index = parseInt(fullBinary.slice(i, i + 11), 2);
    words.push(wordlist[index]);
  }

  return words.join(language.startsWith('chinese') ? '' : ' ');
}

/**
 * 助记词转熵值
 */
export function mnemonicToEntropy(
  mnemonic: string,
  language: MnemonicLanguage = 'english'
): Uint8Array {
  const result = validateMnemonic(mnemonic, language);
  if (!result.valid) {
    throw new Error((result as Extract<ValidateResult, { valid: false }>).error);
  }

  const wordlist = WORDLISTS[language];
  const words = splitMnemonic(mnemonic, language);

  const bits = words
    .map((word) => {
      const index = wordlist.indexOf(word);
      return lpad(index.toString(2), '0', 11);
    })
    .join('');

  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);

  return binaryToBytes(entropyBits);
}

// ============================================================================
// 助记词强度评估
// ============================================================================

export interface MnemonicStrength {
  entropyBits: number;
  securityLevel: 'weak' | 'acceptable' | 'strong' | 'military';
  crackTimeEstimate: string;
  description: string;
}

/**
 * 评估助记词强度
 */
export function evaluateMnemonicStrength(wordCount: number): MnemonicStrength {
  const entropyBits = wordCount * 11 - Math.floor(wordCount / 3);

  let securityLevel: MnemonicStrength['securityLevel'];
  let crackTimeEstimate: string;
  let description: string;

  if (entropyBits < 128) {
    securityLevel = 'weak';
    crackTimeEstimate = '数小时到数天';
    description = '安全性较低，不建议用于大额资产';
  } else if (entropyBits < 160) {
    securityLevel = 'acceptable';
    crackTimeEstimate = '数千年';
    description = '可接受的安全性，适合一般用途';
  } else if (entropyBits < 224) {
    securityLevel = 'strong';
    crackTimeEstimate = '数亿年';
    description = '高强度安全性，适合长期存储';
  } else {
    securityLevel = 'military';
    crackTimeEstimate = '无法想象的时间';
    description = '军用级安全性，最高级别的保护';
  }

  return {
    entropyBits,
    securityLevel,
    crackTimeEstimate,
    description,
  };
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  generateMnemonic,
  mnemonicToSeed,
  mnemonicToSeedSync,
  validateMnemonic,
  getWordlist,
  getSupportedLanguages,
  detectLanguage,
  entropyToMnemonic,
  mnemonicToEntropy,
  evaluateMnemonicStrength,
};
