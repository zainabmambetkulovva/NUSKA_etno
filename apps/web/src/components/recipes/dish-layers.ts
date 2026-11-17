/** Parts a dish can be taken apart into (see the 3D exploded view). */
export type DishLayerKind =
  | 'plate'
  | 'noodles'
  | 'meat'
  | 'onion'
  | 'broth'
  | 'kattama'
  | 'butter'
  | 'honey'
  | 'saucer'
  | 'piala'
  | 'tea'
  | 'navat'
  | 'zhupka'
  | 'cloth'
  | 'ayak'
  | 'kymyz';

/** Height of layer `i` of `count` in the scene (bottom → top). */
export function layerY(i: number, count: number) {
  const gap = count > 4 ? 0.78 : 0.95;
  return (i - (count - 1) / 2) * gap;
}

/** The parts of every recipe, bottom → top (their names are in the dictionary). */
export const DISH_LAYERS: Record<string, DishLayerKind[]> = {
  'besh-barmak': ['plate', 'noodles', 'meat', 'onion', 'broth'],
  'kattama-bal': ['plate', 'kattama', 'butter', 'honey'],
  'chai-navat': ['saucer', 'piala', 'tea', 'navat', 'zhupka'],
  kymyz: ['cloth', 'ayak', 'kymyz'],
};
