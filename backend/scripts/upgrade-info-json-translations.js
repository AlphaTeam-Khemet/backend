const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'database', 'data');

const translations = {
  Akhenaten: {
    fr: {
      name: 'Akhenaton',
      description: 'Akhenaton est l’un des pharaons les plus connus d’Égypte. Au cours de la cinquième année de son règne, il changea son nom d’Amenhotep IV, qui signifie « Amon est satisfait », en Akhenaton. Il le fit parce qu’il abandonna le polythéisme traditionnel égyptien. Il fonda un culte monothéiste consacré au dieu solaire Aton et fit détruire les temples d’Amon. Sa nouvelle religion fut appelée atonisme. Elle est considérée comme l’une des premières tentatives connues de monothéisme dans le monde. Naturellement, cela lui attira l’hostilité de nombreux prêtres de l’ancienne religion.',
    },
    es: {
      name: 'Akenatón',
      description: 'Akenatón es uno de los faraones más conocidos de Egipto. En el quinto año de su reinado cambió su nombre de Amenhotep IV, que significa «Amón está satisfecho», por Akenatón. Lo hizo porque abandonó el politeísmo tradicional de Egipto. Fundó un culto monoteísta dedicado al dios solar Atón y destruyó los templos de Amón. Su nueva religión se llamó atonismo. Fue uno de los primeros intentos conocidos de monoteísmo en el mundo. Naturalmente, esto le creó enemigos entre muchos sacerdotes de la antigua religión.',
    },
    zh: {
      name: '阿肯那顿',
      description: '阿肯那顿是埃及最著名的法老之一。在他统治的第五年，他把自己的名字从阿蒙霍特普四世改为阿肯那顿；原名意为“阿蒙感到满足”。他这样做是因为他放弃了埃及传统的多神信仰。他建立了对太阳神阿顿的单一神崇拜，并摧毁了阿蒙神庙。他的新宗教被称为阿顿崇拜，被认为是世界上最早的单一神信仰尝试之一。自然，这使他与旧宗教的许多祭司为敌。',
    },
  },
  Bent_Pyramid_Senefru: {
    fr: {
      name: 'Pyramide rhomboïdale de Snéfrou',
      description: 'La pyramide rhomboïdale est une ancienne pyramide égyptienne située dans la nécropole royale de Dahchour, à environ 40 kilomètres au sud du Caire. Elle fut construite sous le règne du pharaon Snéfrou de l’Ancien Empire. Exemple unique du développement précoce des pyramides en Égypte, elle fut la deuxième des quatre pyramides édifiées par Snéfrou.',
    },
    es: {
      name: 'Pirámide acodada de Seneferu',
      description: 'La pirámide acodada es una antigua pirámide egipcia situada en la necrópolis real de Dahshur, a unos 40 kilómetros al sur de El Cairo. Fue construida durante el reinado del faraón Seneferu del Imperio Antiguo. Es un ejemplo único del desarrollo temprano de las pirámides en Egipto y fue la segunda de las cuatro pirámides construidas por Seneferu.',
    },
    zh: {
      name: '斯尼夫鲁弯曲金字塔',
      description: '弯曲金字塔是一座古埃及金字塔，位于开罗以南约40公里的达舒尔皇家墓地，由古王国时期的法老斯尼夫鲁建造。它是埃及早期金字塔发展中的独特实例，也是斯尼夫鲁建造的四座金字塔中的第二座。',
    },
  },
  Hanging_Obelisk: {
    fr: {
      name: 'Obélisque suspendu',
      description: 'Ramsès II fit ériger plus de dix obélisques à Tanis, aujourd’hui San el-Hagar, dans le delta oriental. Avec une hauteur totale de 16 mètres, cet obélisque de granit est le plus haut jamais dressé à Tanis. Ses quatre faces portent des inscriptions donnant le nom d’Horus, le nom de couronnement et le nom de naissance du roi. Cet obélisque de 87 tonnes est aujourd’hui élevé sur une plateforme soutenue par quatre piliers massifs, posés sur une grande base de béton. Cette présentation permet aux visiteurs du Grand Musée Égyptien de voir les cartouches de Ramsès II sculptés sur sa base. Placé dans une place de 30 000 mètres carrés, l’Obélisque suspendu est le premier artefact qui accueille les visiteurs du Grand Musée Égyptien.',
    },
    es: {
      name: 'Obelisco suspendido',
      description: 'Ramsés II levantó más de diez obeliscos en Tanis, actual San el-Hagar, en el delta oriental. Con una altura total de 16 metros, este obelisco de granito es el más alto que se alzó jamás en Tanis. En sus cuatro lados aparecen inscripciones con el nombre de Horus, el nombre de trono y el nombre de nacimiento del rey. El obelisco, de 87 toneladas, se encuentra hoy elevado sobre una plataforma sostenida por cuatro enormes pilares sobre una gran base de hormigón. Así, los visitantes del Gran Museo Egipcio pueden ver los cartuchos de Ramsés II tallados en su parte inferior. Situado en una plaza de 30 000 metros cuadrados, el Obelisco suspendido es el primer artefacto que recibe a los visitantes del Gran Museo Egipcio.',
    },
    zh: {
      name: '悬挂方尖碑',
      description: '拉美西斯二世曾在东部三角洲的塔尼斯（今圣哈加尔）竖立十多座方尖碑。这座花岗岩方尖碑总高16米，是塔尼斯曾经矗立过的最高方尖碑。方尖碑四面刻有铭文，记录了国王的荷鲁斯名、王位名和出生名。如今，这座重达87吨的方尖碑被升置在一座由四根巨大柱子支撑的平台上，平台下方是大型混凝土基座，使大埃及博物馆的参观者能够看到刻在底部的拉美西斯二世王名圈。它位于一片3万平方米的广场中，是迎接大埃及博物馆游客的第一件文物。',
    },
  },
  Khafre_Pyramid: {
    fr: {
      name: 'Pyramide de Khéphren',
      description: 'La pyramide de Khéphren est la pyramide centrale des trois grandes pyramides égyptiennes de Gizeh. Elle est la deuxième plus haute et la deuxième plus grande du groupe. C’est la seule des trois pyramides qui conserve encore une partie de son revêtement au sommet. Elle servit de tombeau au pharaon Khéphren de la IVe dynastie, qui régna vers 2558–2532 av. J.-C.',
    },
    es: {
      name: 'Pirámide de Kefrén',
      description: 'La pirámide de Kefrén es la central de las tres grandes pirámides egipcias de Guiza, y la segunda más alta y segunda más grande del conjunto. Es la única de las tres que aún conserva parte del revestimiento en la cima. Fue la tumba del faraón Kefrén, de la IV Dinastía, que gobernó hacia 2558–2532 a. C.',
    },
    zh: {
      name: '卡夫拉金字塔',
      description: '卡夫拉金字塔是吉萨三大古埃及金字塔中位于中间的一座，也是其中第二高、第二大的金字塔。它是三座金字塔中唯一仍在顶部保留部分外覆石的金字塔。它是第四王朝法老卡夫拉的陵墓，卡夫拉约在公元前2558年至前2532年统治埃及。',
    },
  },
  Khufu_Solar_Boat: {
    fr: {
      name: 'Barque solaire de Khéops',
      description: 'Le complexe funéraire de la Grande Pyramide du roi Khéops à Gizeh a livré cinq fosses à bateaux. Trois fosses vides furent découvertes à l’extérieur du temple funéraire de la pyramide et au nord de sa chaussée. En 1954, lors du dégagement du sable et des débris accumulés du côté sud de la pyramide, deux fosses scellées furent découvertes. Elles contenaient les pièces de bois démontées des bateaux du roi Khéops. Le premier bateau fut trouvé enfoui dans une fosse sous des blocs de calcaire. Il fallut plus de dix ans pour le réassembler. C’est une immense structure en bois mesurant 42,32 mètres de long. Depuis les années 1970, plusieurs projets de déplacement furent proposés, mais les risques liés à son démontage empêchèrent leur réalisation. En 2019, il fut décidé de transporter la barque entière et intacte au Grand Musée Égyptien, après de vastes études techniques et archéologiques.',
    },
    es: {
      name: 'Barca solar de Keops',
      description: 'El complejo funerario de la Gran Pirámide del rey Keops en Guiza reveló cinco fosas de barcos. Tres fosas vacías fueron descubiertas fuera del templo funerario de la pirámide y al norte de su calzada. En 1954, mientras se retiraban la arena y los escombros acumulados frente al lado sur de la pirámide, se hallaron dos fosas selladas que contenían la madera desmontada de las barcas del rey Keops. La primera barca fue encontrada enterrada bajo bloques de piedra caliza. Se necesitaron más de diez años para volver a ensamblarla. Es una enorme estructura de madera con una longitud total de 42,32 metros. Desde la década de 1970 se propusieron varios planes para trasladarla, pero los riesgos de desmontarla impidieron su ejecución. En 2019 se decidió transportar la barca completa e intacta al Gran Museo Egipcio, tras extensos estudios de ingeniería y arqueología.',
    },
    zh: {
      name: '胡夫太阳船',
      description: '吉萨胡夫国王大金字塔的丧葬建筑群中发现了五个船坑，其中三个空坑位于金字塔祭庙外以及堤道北侧。1954年，在清理金字塔南侧堆积的沙土和碎石时，人们发现了两个封闭船坑，里面保存着胡夫国王船只被拆解后的木构件。第一艘船埋在石灰岩块覆盖的坑中，重新组装耗时十多年。它是一艘巨大的木质结构，全长42.32米。自20世纪70年代以来，人们曾提出多种迁移方案，但由于拆解风险过高而未能实施。2019年，在大量工程和考古研究之后，决定将整艘船完整运往大埃及博物馆。',
    },
  },
  Mask_of_Tutankhamun: {
    fr: {
      name: 'Masque de Toutankhamon',
      description: 'Ce masque en or massif est l’un des objets les plus célèbres du monde. Il fut trouvé posé sur la tête et les épaules des restes momifiés de Toutankhamon. Le roi y est représenté à l’image du dieu Osiris, souverain du monde souterrain, et du dieu solaire Rê, dont le corps était fait d’or et les cheveux de lapis-lazuli. En même temps, il présente une version idéale du visage de Toutankhamon, reconnaissable sur ses cercueils, ses statues et ses reliefs de temple. Une inscription au dos offre une protection supplémentaire en associant les différentes parties du masque à des divinités : « Ton front est Anubis, ton œil droit est la barque de nuit de Rê, ton œil gauche est la barque de jour, tes sourcils sont en compagnie des neuf dieux ».',
    },
    es: {
      name: 'Máscara de Tutankamón',
      description: 'Esta máscara de oro macizo es uno de los objetos más famosos del mundo. Fue encontrada colocada sobre la cabeza y los hombros de los restos momificados de Tutankamón. El rey aparece representado como el dios Osiris, señor del inframundo, y como el dios solar Ra, cuyo cuerpo era de oro y cuyo cabello era de lapislázuli. Al mismo tiempo, muestra una versión ideal del rostro de Tutankamón, reconocible en sus ataúdes, estatuas y relieves de templos. Una inscripción en la parte posterior proporciona protección adicional al identificar distintas partes de la máscara con varios dioses: «Tu frente es Anubis, tu ojo derecho es la barca nocturna de Ra, tu ojo izquierdo es la barca diurna, tus cejas están en compañía de los nueve dioses».',
    },
    zh: {
      name: '图坦卡蒙面具',
      description: '这件纯金面具是世界上最著名的文物之一。它被发现时覆盖在图坦卡蒙木乃伊遗体的头部和肩部。国王被塑造成冥界之主奥西里斯的形象，同时也象征太阳神拉；拉的身体由黄金构成，头发则如青金石一般。与此同时，面具呈现了图坦卡蒙面容的理想化形象，可在他的棺椁、雕像和神庙浮雕中辨认出来。面具背面的铭文通过把面具各部分与不同神祇联系起来，提供进一步保护：“你的额头是阿努比斯，你的右眼是拉的夜船，你的左眼是日船，你的眉毛与九神相伴。”',
    },
  },
  Mummy_Mask_of_Mesehti: {
    fr: {
      name: 'Masque de momie de Mesehti',
      description: 'Les masques funéraires étaient utilisés dans l’Égypte ancienne pour protéger la tête du défunt et garantir que ses traits soient parfaitement représentés. Ce masque de momie en cartonnage appartient à Mesehti, qui fut gouverneur provincial d’Assiout durant les dernières phases de la XIe dynastie. Sa tombe fut découverte en 1893 à Assiout, en Haute-Égypte. Ce masque coloré en cartonnage le montre avec un visage ovale, de grands yeux soulignés, une moustache et une épaisse barbe noire peinte. Il porte une perruque avec un bandeau de lotus noué autour du sommet de la tête, et un large collier multicolore orne sa poitrine.',
    },
    es: {
      name: 'Máscara funeraria de Mesehti',
      description: 'Las máscaras funerarias se usaban en el antiguo Egipto para proteger la cabeza del difunto y asegurar que sus rasgos fueran representados perfectamente. Esta máscara de momia de cartonaje perteneció a Mesehti, quien sirvió como gobernador provincial de Asiut durante las etapas finales de la Dinastía XI. Su tumba fue descubierta en 1893 en Asiut, en el Alto Egipto. Esta máscara de cartonaje coloreada lo muestra con rostro ovalado, grandes ojos delineados, bigote y una espesa barba negra pintada. Lleva una peluca con una cinta de loto atada alrededor de la coronilla, y un amplio collar multicolor adorna su pecho.',
    },
    zh: {
      name: '梅塞赫提木乃伊面具',
      description: '在古埃及，丧葬面具用于保护死者的头部，并确保其面貌被完美呈现。这件纸胎木乃伊面具属于梅塞赫提，他在第十一王朝晚期曾担任阿西乌特的地方总督。他的墓葬于1893年在上埃及阿西乌特被发现。这件彩绘纸胎面具表现出椭圆形面庞、轮廓分明的大眼睛、胡须和浓厚的黑色彩绘长须。他戴着假发，头顶束有莲花饰带，胸前装饰着宽大的多彩项圈。',
    },
  },
  Pyramid_of_Djoser: {
    fr: {
      name: 'Pyramide de Djéser',
      description: 'La pyramide de Djéser, parfois appelée pyramide à degrés de Djéser ou pyramide à degrés d’Horus Netjerikhet, est un site archéologique situé dans la nécropole de Saqqarah, en Égypte, au nord-ouest des ruines de Memphis. Elle fut la première pyramide égyptienne construite. Cette structure à six degrés et quatre faces est le plus ancien édifice colossal en pierre d’Égypte. Elle fut construite au XXVIIe siècle av. J.-C., durant la IIIe dynastie, pour l’inhumation du pharaon Djéser. La pyramide constitue l’élément central d’un vaste complexe funéraire établi dans une immense cour entourée de bâtiments cérémoniels et de décorations.',
    },
    es: {
      name: 'Pirámide de Djoser',
      description: 'La pirámide de Djoser, a veces llamada pirámide escalonada de Djoser o pirámide escalonada de Horus Netjerikhet, es un sitio arqueológico situado en la necrópolis de Saqqara, Egipto, al noroeste de las ruinas de Menfis. Fue la primera pirámide egipcia construida. La estructura de seis niveles y cuatro lados es el edificio colosal de piedra más antiguo de Egipto. Fue construida en el siglo XXVII a. C., durante la III Dinastía, para el entierro del faraón Djoser. La pirámide es el elemento central de un amplio complejo funerario en un enorme patio rodeado de estructuras ceremoniales y decoración.',
    },
    zh: {
      name: '左塞尔金字塔',
      description: '左塞尔金字塔有时也被称为左塞尔阶梯金字塔或荷鲁斯内杰里赫特阶梯金字塔，位于埃及萨卡拉墓地，地处孟菲斯遗址西北方。它是埃及建造的第一座金字塔。这座六层、四面结构是埃及最早的巨型石造建筑。它建于公元前27世纪第三王朝时期，用于安葬法老左塞尔。金字塔是一个庞大丧葬建筑群的核心，周围是一座巨大庭院，环绕着礼仪建筑和装饰。',
    },
  },
  Statue_Ramesses_II: {
    fr: {
      name: 'Statue de Ramsès II',
      description: 'Autrefois comme aujourd’hui, cette statue colossale reflète la puissance et la richesse du roi Ramsès II. Elle se dressait à l’origine devant le temple principal du dieu Ptah à Memphis, gardant son espace sacré intérieur. Pendant de nombreuses années, la statue fut considérée comme une divinité écoutant les prières des fidèles et recevant leurs offrandes. Deux enfants royaux, le prince Khâemouaset et la princesse Bintanath, sont sculptés derrière les jambes du roi.',
    },
    es: {
      name: 'Estatua de Ramsés II',
      description: 'Entonces como ahora, esta estatua gigante refleja el poder y la riqueza del rey Ramsés II. Originalmente se encontraba frente al templo principal del dios Ptah en Menfis, protegiendo su espacio sagrado interior. Durante muchos años, la estatua fue considerada como un dios que escuchaba las oraciones de los devotos y recibía sus ofrendas. Dos hijos reales, el príncipe Khaemwaset y la princesa Bintanath, están tallados detrás de las piernas del rey.',
    },
    zh: {
      name: '拉美西斯二世雕像',
      description: '无论在过去还是现在，这座巨大的雕像都体现了拉美西斯二世国王的权力与财富。它最初矗立在孟菲斯普塔神主神庙外，守护着神庙内部的神圣空间。多年来，人们认为这座雕像如同一位神明，倾听虔诚信徒的祈祷并接受他们的供奉。两位王室子女——哈姆瓦塞特王子和宾塔纳特公主——被雕刻在国王双腿后方。',
    },
  },
  Statue_of_the_Scribe_Mitri: {
    fr: {
      name: 'Statue du scribe Mitri',
      description: 'Cette statue en bois peint appartient à Mitri, qui porta de nombreux titres importants durant la Ve dynastie. Elle le représente assis dans la pose traditionnelle du scribe égyptien, les jambes croisées, avec un rouleau de papyrus partiellement déroulé sur les genoux. Il porte un pagne court et un large collier. Son visage pensif est encadré par des cheveux courts, et ses yeux saisissants sont faits de pierre incrustée. Le nom et les titres de Mitri sont inscrits sur la base de la statue. Parmi ses titres figurent « Administrateur de nome », « Prêtre de la déesse Maât » et « Inspecteur des scribes ».',
    },
    es: {
      name: 'Estatua del escriba Mitri',
      description: 'Esta estatua de madera pintada perteneció a Mitri, quien ostentó muchos títulos importantes durante la Dinastía V. La estatua lo muestra sentado en la postura tradicional de un escriba egipcio, con las piernas cruzadas y un rollo de papiro parcialmente desplegado sobre el regazo. Lleva un faldellín corto y un amplio collar. Su rostro pensativo está enmarcado por el cabello corto, y sus ojos magnéticos están hechos con piedra incrustada. El nombre y los títulos de Mitri están escritos en la base de la estatua. Entre sus títulos se incluyen «Administrador del nomo», «Sacerdote de la diosa Maat» y «Supervisor de escribas».',
    },
    zh: {
      name: '书记官米特里雕像',
      description: '这尊彩绘木雕像属于米特里，他在第五王朝时期拥有许多重要头衔。雕像表现他以埃及书记官的传统姿势坐着，双腿交叉，膝上放着一卷部分展开的纸草卷。他穿着短裙，佩戴宽项圈。短发衬托出他沉思的面容，镶嵌石制成的眼睛十分有神。米特里的名字和头衔刻写在雕像底座上。他的头衔包括“州行政官”、“玛阿特女神祭司”和“书记官监督者”。',
    },
  },
  Stela_of_Neskhonsu: {
    fr: {
      name: 'Stèle de Neskhonsou',
      description: 'Cette stèle en bois peint à sommet arrondi de Neskhonsou fut trouvée à Deir el-Bahari, dans une zone réservée aux sépultures des prêtres du dieu Montou. Le mari de Neskhonsou était prêtre de Montou. La stèle est encadrée par le corps arqué de la déesse du ciel Nout, qui touche la terre du bout des doigts et des pieds. Un disque solaire ailé s’étend au-dessus de hiéroglyphes lisant Behedety, une forme d’Horus d’Edfou. La scène centrale montre Neskhonsou embrassée par la déesse Maât, debout devant un autel, les mains levées en adoration devant le dieu à tête de faucon Rê-Horakhty et la déesse de l’Occident. Dans la partie inférieure, une formule d’offrande demande au dieu Rê-Horakhty d’accorder à Neskhonsou des provisions pour l’au-delà. Neskhonsou descendait apparemment d’une famille sacerdotale, car le texte désigne son père Hormaa comme le « bien-aimé du dieu à Karnak ».',
    },
    es: {
      name: 'Estela de Neskhonsu',
      description: 'Esta estela de madera pintada con parte superior redondeada de Neskhonsu fue hallada en Deir el-Bahari, en una zona dedicada a los enterramientos de los sacerdotes del dios Montu. El esposo de Neskhonsu era sacerdote de Montu. La estela está enmarcada por el cuerpo arqueado de la diosa del cielo Nut, que toca la tierra con las puntas de sus dedos y sus pies. Un disco solar alado se extiende sobre jeroglíficos que dicen Behdety, una forma de Horus de Edfu. La escena central muestra a Neskhonsu abrazada por la diosa Maat mientras está de pie ante un altar, con las manos levantadas en adoración ante el dios con cabeza de halcón Ra-Horakhty y la diosa del Occidente. En la parte inferior, una fórmula de ofrenda pide al dios Ra-Horakhty que conceda provisiones a Neskhonsu para la vida después de la muerte. Neskhonsu aparentemente descendía de una familia sacerdotal, ya que el texto llama a su padre Hormaa «amado del dios en Karnak».',
    },
    zh: {
      name: '内斯孔苏石碑',
      description: '这件内斯孔苏的圆顶彩绘木碑发现于代尔巴哈里，那里有一片专门用于安葬蒙图神祭司的区域。内斯孔苏的丈夫是一名蒙图祭司。石碑由天空女神努特弓形的身体环绕，她以手指和脚尖触碰大地。带翼太阳圆盘横跨在象形文字上方，文字写着贝赫德提，即埃德富荷鲁斯的一种形态。石碑中央场景表现内斯孔苏被玛阿特女神拥抱，她站在祭坛前，双手举起，向鹰首神拉-哈拉赫提和西方女神表示崇拜。石碑下部的供奉祷文请求拉-哈拉赫提赐予内斯孔苏来世所需的供品。内斯孔苏显然出身于祭司家族，因为文中称她的父亲霍尔玛为“卡纳克神所爱之人”。',
    },
  },
  Tut_Coffin: {
    fr: {
      name: 'Cercueil de Toutankhamon',
      description: 'Il s’agit du plus grand des trois cercueils trouvés à l’intérieur du sarcophage du roi Toutankhamon. L’archéologue Howard Carter écrivit qu’après avoir soulevé le lourd couvercle de pierre du sarcophage et retiré deux couches de linges, « un souffle d’émerveillement s’échappa de nos lèvres, tant le spectacle qui s’offrait à nos yeux était magnifique ». La cuve et le couvercle du cercueil sont faits de bois recouvert de plâtre, de lin et d’une fine feuille d’or, tandis que le visage, les oreilles, le cou et les mains du roi sont couverts d’une feuille d’or beaucoup plus épaisse, martelée en forme. Le cercueil est anthropoïde, c’est-à-dire de forme humaine, et montre le roi comme une figure momifiée aux mains croisées.',
    },
    es: {
      name: 'Ataúd de Tutankamón',
      description: 'Este es el mayor de los tres ataúdes encontrados dentro del sarcófago del rey Tutankamón. El excavador Howard Carter escribió que, después de levantar la pesada tapa de piedra del sarcófago y retirar dos capas de vendas de lino, «un suspiro de asombro escapó de nuestros labios, tan magnífica era la visión que se presentó ante nuestros ojos». La caja y la tapa del ataúd están hechas de madera cubierta con yeso, lino y una fina lámina de oro, mientras que el rostro, las orejas, el cuello y las manos del rey están cubiertos con una lámina de oro mucho más gruesa, martillada hasta darle forma. El ataúd es antropoide, es decir, de forma humana, y muestra al rey como una figura momificada con las manos cruzadas.',
    },
    zh: {
      name: '图坦卡蒙棺椁',
      description: '这是图坦卡蒙国王石棺内发现的三具棺椁中最大的一具。发掘者霍华德·卡特写道，当他们掀开沉重的石棺盖，并揭去两层亚麻裹布后，“我们不禁发出惊叹，因为眼前的景象实在太华丽了”。棺身和棺盖由木材制成，表面覆盖石膏、亚麻和薄金箔；而国王的面部、耳朵、颈部和双手则覆盖着更厚的金片，并被锤打成形。这具棺椁为人形棺，表现国王如木乃伊般双手交叉的形象。',
    },
  },
  sphinx: {
    fr: {
      name: 'Grand Sphinx de Gizeh',
      description: 'Le Grand Sphinx de Gizeh est une statue en calcaire représentant un sphinx couché, créature mythique dotée d’une tête humaine et d’un corps de lion. Le monument fut sculpté dans le substrat calcaire de la formation de Mokattam, datant de l’Éocène, et fait face à l’est sur le plateau de Gizeh, sur la rive ouest du Nil, en Égypte. Plus ancienne sculpture monumentale connue d’Égypte, le Sphinx fait partie de la nécropole memphite et est inscrit au patrimoine mondial de l’UNESCO.',
    },
    es: {
      name: 'Gran Esfinge de Guiza',
      description: 'La Gran Esfinge de Guiza es una estatua de piedra caliza que representa una esfinge recostada, una criatura mítica con cabeza humana y cuerpo de león. El monumento fue tallado en el lecho de caliza de la formación Mokattam, de edad eocena, y mira hacia el este en la meseta de Guiza, en la orilla occidental del Nilo, en Egipto. Es la escultura monumental más antigua conocida de Egipto. La Esfinge forma parte de la necrópolis menfita y es Patrimonio Mundial de la UNESCO.',
    },
    zh: {
      name: '吉萨大狮身人面像',
      description: '吉萨大狮身人面像是一座石灰岩雕像，表现为卧姿的斯芬克斯——一种拥有人的头部和狮子身体的神话生物。这座纪念性雕塑由始新世莫卡塔姆组石灰岩基岩雕成，面向东方，位于埃及尼罗河西岸的吉萨高原。作为埃及已知最古老的纪念性雕塑，狮身人面像是孟菲斯墓地的一部分，也是联合国教科文组织世界遗产。',
    },
  },
};

for (const [folder, values] of Object.entries(translations)) {
  const infoPath = path.join(DATA_DIR, folder, 'info.json');
  if (!fs.existsSync(infoPath)) {
    throw new Error(`Missing info.json for ${folder}`);
  }

  const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
  info.names = info.names || {};
  info.descriptions = info.descriptions || {};

  for (const [code, translation] of Object.entries(values)) {
    info.names[code] = translation.name;
    info.descriptions[code] = translation.description;
  }

  fs.writeFileSync(infoPath, `${JSON.stringify(info, null, 2)}\n`, 'utf-8');
}

console.log(`Updated ${Object.keys(translations).length} info.json files.`);
