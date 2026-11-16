export interface HorrorIdeaSpec {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  category: 'resource' | 'audio' | 'combat' | 'graphics' | 'atmosphere';
  description: string;
  actionId?: string;
  actionLabel?: string;
}

/**
 * 10 Deeply Integrated Survival-Horror & Graphics Mod Ideas
 * Every single idea is actively wired into the game simulation, WebGL renderer, and Web Audio engine.
 */
export const TEN_HORROR_IDEAS: HorrorIdeaSpec[] = [
  {
    id: 'corroded_batteries',
    number: 1,
    title: 'Деградация ёмкости батарей по дням',
    subtitle: 'ДЕНЬ 1: 100% → ДЕНЬ 7: 45% МАКС. ЗАРЯД',
    category: 'resource',
    description:
      'Окисление и мороз разрушают найденные аккумуляторы. С каждым прожитым днём падает как потолок максимального заряда фонарика, так и объём энергии от каждой батарейки (+55% в День 1 → +25% в День 7).',
    actionId: 'test_battery_decay',
    actionLabel: 'Проверить деградацию заряда',
  },
  {
    id: 'abyssal_scream',
    number: 2,
    title: 'Многослойный вокально-формантный крик твари',
    subtitle: 'БЕЗ ДЕТСКИХ ЗВУКОВ И ДЕШЁВЫХ СКРИМЕРОВ',
    category: 'audio',
    description:
      'Детские пищащие звуки и мультяшные скримеры полностью удалены. Вместо них синтезируется многослойный гортанный крик через 3 резонансных формантных фильтра (420/1150/2650 Гц) с нелинейным дисторшном и инфразвуковым ударом 28 Гц.',
    actionId: 'scream_roar',
    actionLabel: 'Прослушать жуткий крик твари',
  },
  {
    id: 'uv_blacklight',
    number: 3,
    title: 'УФ-режим фонарика (UV Blacklight)',
    subtitle: 'СПЕКТРАЛЬНЫЙ ФИОЛЕТОВЫЙ ЛУЧ [U]',
    category: 'atmosphere',
    description:
      'Переключение фонарика в ультрафиолетовый спектр потребляет на 30% меньше заряда в поздние дни, окрашивает луч в холодный фиолетовый спектр и ослепляет чувствительные глаза ночных ползунов.',
    actionId: 'toggle_uv',
    actionLabel: 'Переключить УФ-спектр [U]',
  },
  {
    id: 'crimson_flare',
    number: 4,
    title: 'Сигнальный багровый фальшфейер',
    subtitle: 'ДИНАМИЧЕСКИЙ ИСТОЧНИК СВЕТА [X]',
    category: 'combat',
    description:
      'Бросаемый пиротехнический факел горит 18 секунд на полу, заливая коридор тревожным багровым светом без расхода батареи фонарика и отпугивая тварей шипящим магниевым пламенем.',
    actionId: 'throw_flare',
    actionLabel: 'Зажечь и бросить фальшфейер [X]',
  },
  {
    id: 'adrenaline_injector',
    number: 5,
    title: 'Экстренный инъектор адреналина',
    subtitle: 'ПОДАВЛЕНИЕ ПАНИКИ И РЫВОК СКОРОСТИ',
    category: 'resource',
    description:
      'Шприц с адреналином мгновенно снимает тремор прицела, сбрасывает панику до 0%, восстанавливает 100% запаса дыхания и ускоряет бег на 12 секунд для прорыва из окружения.',
    actionId: 'use_adrenaline',
    actionLabel: 'Вколоть адреналин',
  },
  {
    id: 'bio_emp_interference',
    number: 6,
    title: 'Био-ЭМИ помехи при близости твари',
    subtitle: 'ПАРАЗИТНЫЙ РАЗРЯД И МЕРЦАНИЕ СВЕТА',
    category: 'atmosphere',
    description:
      'Когда тварь подходит ближе 4.5 метров, её биоэлектрическое поле вызывает гудение спирали фонарика, просадку напряжения и тревожное мерцание комнатного света.',
    actionId: 'spawn_stalker',
    actionLabel: 'Призвать Сталкера рядом',
  },
  {
    id: 'bleeding_trail',
    number: 7,
    title: 'Кровотечение и запах крови при ранении',
    subtitle: 'ОХОТА ПО СЛЕДУ ПРИ HP < 35%',
    category: 'combat',
    description:
      'При тяжёлом ранении (здоровье ниже 35%) дыхание сбивается, а слух и чутье тварей усиливаются на 35%, пока игрок не перевяжет раны аптечкой.',
    actionId: 'heal',
    actionLabel: 'Перевязать раны (+HP)',
  },
  {
    id: 'claustrophobic_hypoxia',
    number: 8,
    title: 'Клаустрофобия и гипоксия в укрытии',
    subtitle: 'ЗАДЕРЖКА ДЫХАНИЯ ДО ТЕМНОТЫ В ГЛАЗАХ [B]',
    category: 'atmosphere',
    description:
      'В шкафу или под диваном задержка дыхания полностью гасит шум, но при падении кислорода ниже 20% края экрана затягивает пульсирующей тьмой и раздаётся глухой стук собственного сердца.',
    actionId: 'test_heartbeat',
    actionLabel: 'Проверить пульс гипоксии',
  },
  {
    id: 'biomechanical_models',
    number: 9,
    title: 'Детализированные 3D-модели оружия и тварей',
    subtitle: 'РЁБРА, КОГТИ, ОПТИКА И ПЛАНКИ ПИКАТИННИ',
    category: 'graphics',
    description:
      'Переработанные многокомпонентные 3D-модели: открытая грудная клетка, позвоночник, удлинённые когти и рассечённая челюсть у тварей; планки Пикатинни, дульный тормоз, затвор и тритиевые целики у оружия.',
    actionId: 'weapons',
    actionLabel: 'Выдать обновлённый арсенал',
  },
  {
    id: 'ultra_graphics_mod',
    number: 10,
    title: 'Graphics Mod: Кинематографический Мрак и PBR',
    subtitle: 'НАСТРАИВАЕМЫЙ КОНТРАСТ, ЭКСПОЗИЦИЯ И РЕЛЬЕФ',
    category: 'graphics',
    description:
      'Встроенный графический мод с ползунками глубины мрака, насыщенности PBR-бликов RoomEnvironment, интенсивности зерна плёнки и холодного хоррор-грейдинга.',
    actionId: 'preset_nightmare_gfx',
    actionLabel: 'Включить пресет «Абсолютный Мрак»',
  },
];
