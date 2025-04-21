// Access index key of the grandparent data node in keyChains.
// TODO 暂时是为了map、set类型数据的原型函数的更新处理拿到祖父节点数据，后续看是否会有额外多余的作用
export const __GRANDPARENT_KEY__ = Symbol("grandparentKey");

// The key is a flag indicating whether the `iteratorProcessing` function has completed processing.
export const __ITERATOR_META_PROCESSING_KEY__ = Symbol("iteratorMetaProcessingKey");
