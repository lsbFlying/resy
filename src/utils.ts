import type { PrimitiveState, MapType } from "./model";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * @description 跟进状态map
 * 相较于直接赋值新值的方式也更快
 * forEach在少量数据情况下较for of略有劣势
 * 但在数据较多情况下的会强于于for of，
 * 考虑到for of只有100级别的小数据场景占优其余均劣势
 * 所以使用forEach
 */
export const followUpMap = <K, V>(map: Map<K, V>) => {
  const mapTemp: Map<K, V> = new Map();
  map.forEach((value, key) => {
    mapTemp.set(key, value);
  });
  return mapTemp;
};

/**
 * map转object
 * @description 解决回调参数如果是map的proxy代理的话无法做扩展运算的问题
 * 使用map的forEach也可以，并且在数据量较大的时候比for of更快，
 * 但是这里一般数据量认为不会过大达到百万级别，且在大数据量的时候并没有拉开足够的差距
 * 以及forEach占优的场景比例较多，所以for of的方式依旧是众多方式中最综合高效的方式
 */
export const mapToObject = <S extends PrimitiveState>(map: MapType<S>): S => {
  const object = {} as S;
  for (const [key, value] of map) {
    object[key] = value;
  }
  return object;
};

/**
 * object转map
 * @description 性能相对较高的浅转换
 */
export const objectToMap = <S extends PrimitiveState>(object: S) => Object.keys(object)
  .reduce((prev, key) => {
    prev.set(key, object[key]);
    return prev;
  }, new Map());

/**
 * 清空对象
 * @description 在未达到百万级别的数据量的时候该实现方式相对具有较大优势
 * 且在即使接近或者达到甚至超过百万级别的数据量的情况下该方式仍然与其他实现方式相差性能不大
 * 所以下面的实现方式仍然是相对最优解
 *
 * 🌟无论是mapToObject、objectToMap还是clearObject，都是对性能和内存的综合考量
 * 本身外部是使用object肯定是大多数场景，但是内部使用转换一层map、set是出于map、set的性能优越性考虑
 * 但是这样一来似乎与互相转换的成本中此消彼长，但实际上并非如此，首先就mapToObject而言
 * 纵观resy的整个源码中，它的使用场景都是少数场景，即使在setState、syncUpdate中的函数参数的更新场景中也是不常见不常用的
 * 其次是objectToMap，它的使用场景一是createStore中的静态初始化执行使用，这点并非运行中使用，
 * 且resy认为store作为分化并非统一独一的store而言不存在大数据程度的属性挂载，常规使用基本不会影响其运行性能，
 * 二是在view中的使用场景，而view本身是memo结合resy的进阶，memo本身是有缓存优化，结合这点也不会存在性能消耗，
 * 且view的时候是针对耗性能的组件而言，所以这点结合store不会有大数据属性挂载的情况综合而言也是不会有性能问题的，
 * 所以mapToObject、objectToMap整体综合考量是由于object的使用情况的。
 * 最后一点是clearObject，可以确定的是它的执行消耗肯定是比直接一个空对象赋值要多，但是出于内存考虑
 * 我们认为减少内存占用也是一部分优化场景有必要的，否则就会有大量的reduce中的拆离处理的函数回到createStore的内部当中
 * 这样产生的冗余内存在一个系统中可能占用的内存是很可观的，优化这一部分内存占用是有必要的。
 * 总而言之，性能与内存就像物理学中的P=FV，对应到现实世界中就像力量与速度的结合，肌肉大则力量大但是速度降低，反之速度快但肌肉变小但是力量就会弱
 * 我们寻求的是一个FV的最大或者最综合全面的需求考虑，所以目前的考虑即是如此，后续有更优解再进一步加强
 */
export const clearObject = <S extends PrimitiveState>(object: S) => {
  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      delete object[key];
    }
  }
};
