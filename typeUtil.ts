/** Makes certain keys K in type T Optional */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

/** Makes certain keys K in type T Required */
export type Require<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};

/** Requires at least one key K in type T */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> &
            Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];

/** Requires at exactly one key K in type T */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> &
            Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];

// ====================================

/**
 * Gets all property keys that appear in at least one member of the union T.
 * Unlike `keyof T`, this includes keys that exist in *some* members but not all.
 */
type AllKeys<T> = T extends T ? keyof T : never;

/**
 * Extracts the property type for key K across all members of the union T.
 * - If some members don't have K, their contribution is skipped.
 * - If multiple members define K, the resulting type is the union of all those types.
 */
type PropType<T, K extends PropertyKey> =
    T extends Partial<Record<K, infer V>> ? V : never;

/**
 * Determines whether property K is declared as optional in type T.
 * - Returns `true` if K is optional or not present at all in T.
 * - Returns `false` if K is required in T.
 */
type IsOptional<T, K extends PropertyKey> = K extends keyof T
    ? object extends Pick<T, K>
        ? true
        : false
    : true;

/**
 * Builds a new type that exposes the union T as a single object type:
 * - Properties required in *all* members of T remain required.
 * - Properties missing in some members or declared optional in any member become optional.
 * - Property types are preserved as unions if they differ across members.
 */
export type OptionalUnion<T> = {
    // Required properties: exist in every member of T, and never marked optional
    [K in AllKeys<T> as [T] extends [Record<K, any>]
        ? IsOptional<T, K> extends true
            ? never
            : K
        : never]: PropType<T, K>;
} & {
    // Optional properties: either missing in some members, or optional in at least one
    [K in AllKeys<T> as [T] extends [Record<K, any>]
        ? IsOptional<T, K> extends true
            ? K
            : never
        : K]?: PropType<T, K>;
};

/**
 * Process a raw union type and attach a discriminant based on the presence of a property.
 *
 * @template T - Union of raw input types (without discriminant)
 * @template DKey - Name of the discriminant property
 * @template V_T - Enum type/value for the branch where the property exists
 * @template V_F - Enum type/value for the branch where the property does not exist
 * @template CKey - Property used to distinguish versions (must exist in at least one union member)
 *
 * @param data - Raw object from the API (one member of the union)
 * @param checkProp - Property to check for existence
 * @param discriminantKey - Discriminant property key
 * @param existsValue - Value if `checkProp` exists (V_T)
 * @param notExistsValue - Value if `checkProp` does not exist (V_F)
 *
 * @returns The correctly typed discriminated union member
 */
export function processTypeVersion<
    T_Exists extends object,
    T_NotExists extends object,
    CKey extends keyof T_Exists,
    DKey extends string,
    V_T extends string | number,
    V_F extends string | number,
>(
    data: T_Exists | T_NotExists,
    checkProp: CKey,
    discriminantKey: DKey,
    existsValue: V_T,
    notExistsValue: V_F
): (T_Exists & Record<DKey, V_T>) | (T_NotExists & Record<DKey, V_F>) {
    return checkProp in data
        ? ({ ...data, [discriminantKey]: existsValue } as T_Exists &
              Record<DKey, V_T>)
        : ({ ...data, [discriminantKey]: notExistsValue } as T_NotExists &
              Record<DKey, V_F>);
}
