export type Effect<Type extends string = string, Return = any> = {
  type: Type
  _Return?: Return
} & {
  [key: string]: any
}

export type EffectReturnType<E extends Effect> = E extends Effect<string, infer R> ? R : never