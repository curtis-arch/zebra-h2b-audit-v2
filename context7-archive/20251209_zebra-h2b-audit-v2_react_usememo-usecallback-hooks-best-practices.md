---
query_date: 2025-12-09 20:02:32 UTC
library: /facebook/react/v19_2_0
topic: useMemo useCallback hooks best practices
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: useMemo useCallback hooks best practices

### Original `useMemo` hook implementation in React

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/preserve-memo-validation/useMemo-invoke-prop.expect.md

Defines a React custom hook `useFoo` that utilizes the `useMemo` hook to memoize the creation of an array. The array's content is determined by a callback function provided as a prop, highlighting a common pattern for memoizing derived values.

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useMemo} from 'react';

function useFoo({callback}) {
  return useMemo(() => new Array(callback()), [callback]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [
    {
      callback: () => {
        'use no forget';
        return [1, 2, 3];
      },
    },
  ],
};
```

--------------------------------

### Original React Hook with useMemo (JavaScript)

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/consecutive-use-memo.expect.md

This snippet defines a React hook `useHook` that utilizes the `useMemo` hook to memoize two values, `valA` and `valB`, based on their respective dependencies `a` and `b`. It also includes a `FIXTURE_ENTRYPOINT` for testing the hook, showcasing a common pattern for optimizing derived state in React.

```javascript
import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function useHook({a, b}) {
  const valA = useMemo(() => identity({a}), [a]);
  const valB = useMemo(() => identity([b]), [b]);
  return [valA, valB];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{a: 2, b: 3}]
};
```

--------------------------------

### Original React Hook with useMemo (JavaScript)

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/preserve-memo-validation/useMemo-constant-prop.expect.md

This JavaScript code defines a `useFoo` React hook that utilizes `useMemo` for memoizing derived values. It showcases standard React hook usage before compiler optimization, including conditional expressions and multiple `useMemo` calls with a shared dependency.

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function useFoo(cond) {
  const sourceDep = 0;
  const derived1 = useMemo(() => {
    return identity(sourceDep);
  }, [sourceDep]);
  const derived2 = (cond ?? Math.min(sourceDep, 1)) ? 1 : 2;
  const derived3 = useMemo(() => {
    return identity(sourceDep);
  }, [sourceDep]);
  const derived4 = (Math.min(sourceDep, -1) ?? cond) ? 1 : 2;
  return [derived1, derived2, derived3, derived4];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [true],
};
```

--------------------------------

### Define React custom hook with useMemo and identity function

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/preserve-memo-validation/useMemo-inner-decl.expect.md

This JavaScript code defines a React custom hook, `useFoo`, which utilizes `useMemo` to memoize an object containing a temporary value derived from `data.a` using an `identity` function. It ensures that the computation is re-executed only when `data.a` changes, optimizing performance. The `FIXTURE_ENTRYPOINT` exports the hook and its parameters for testing or demonstration purposes.

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function useFoo(data) {
  return useMemo(() => {
    const temp = identity(data.a);
    return {temp};
  }, [data.a]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2}],
};
```

--------------------------------

### React `useKeyedState` Custom Hook with `useMemo` Anti-pattern

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/error.invalid-setState-in-useMemo-indirect-useCallback.expect.md

This JavaScript code defines a custom React hook, `useKeyedState`, intended to reset state whenever its `key` or `init` dependencies change. It employs `useState`, `useCallback`, and `useMemo` but contains an anti-pattern: calling `setState` indirectly from within `useMemo`. This setup inevitably leads to an infinite re-render loop as state changes trigger re-evaluations of the memoized function, which then sets state again.

```javascript
import {useCallback} from 'react';

function useKeyedState({key, init}) {
  const [prevKey, setPrevKey] = useState(key);
  const [state, setState] = useState(init);

  const fn = useCallback(() => {
    setPrevKey(key);
    setState(init);
  });

  useMemo(() => {
    fn();
  }, [key, init]);

  return state;
}
```

--------------------------------

### Define React Hook with useMemo and useState

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/preserve-memo-validation/useMemo-in-other-reactive-block.expect.md

This JavaScript snippet defines a React custom hook, `useFoo`, which utilizes `useMemo` to memoize a style object based on `width` and `minWidth` dependencies, and `useState` to manage an internal `width` state. It also demonstrates array manipulation with `arrayPush` from `shared-runtime`.

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo, useState} from 'react';
import {arrayPush} from 'shared-runtime';

// useMemo-produced values can exist in nested reactive blocks, as long
// as their reactive dependencies are a subset of depslist from source
function useFoo(minWidth, otherProp) {
  const [width, setWidth] = useState(1);
  const x = [];
  const style = useMemo(() => {
    return {
      width: Math.max(minWidth, width),
    };
  }, [width, minWidth]);
  arrayPush(x, otherProp);
  return [style, x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, 'other'],
};
```

--------------------------------

### Incorrect React useMemo Usage Without Return Value

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/error.useMemo-no-return-value.expect.md

This JavaScript code demonstrates an improper use of React's `useMemo` hook where the callback function performs a side effect (`console.log`) but does not explicitly return a value. The `useMemo` hook is intended for memoizing calculated values, and its callback should always return the value to be cached, otherwise its purpose is defeated.

```javascript
// @validateNoVoidUseMemo
function Component() {
  const value = useMemo(() => {
    console.log('computing');
  }, []);
  const value2 = React.useMemo(() => {
    console.log('computing');
  }, []);
  return (
    <div>
      {value}
      {value2}
    </div>
  );
}
```

--------------------------------

### Standard useMemo Hook Implementation in React (JavaScript)

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/useMemo-arrow-implicit-return.expect.md

This snippet demonstrates the typical way to use React's `useMemo` hook. It memoizes the result of `computeValue()` based on an empty dependency array, ensuring the value is only recomputed if its dependencies change.

```javascript
// @validateNoVoidUseMemo
function Component() {
  const value = useMemo(() => computeValue(), []);
  return <div>{value}</div>;
}
```

--------------------------------

### React Compiler output for `useMemo` hook

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/preserve-memo-validation/useMemo-invoke-prop.expect.md

Presents the transformed version of the `useFoo` hook after processing by the React Compiler. It replaces the `useMemo` call with explicit memoization logic using a mutable array `$` to store and retrieve memoized values, reflecting compiler-driven optimization.

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useMemo } from "react";

function useFoo(t0) {
  const $ = _c(2);
  const { callback } = t0;
  let t1;
  if ($[0] !== callback) {
    t1 = new Array(callback());
    $[0] = callback;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [
    {
      callback: () => {
        "use no forget";
        return [1, 2, 3];
      },
    },
  ],
};
```

--------------------------------

### React Component Memoization using useMemo Hook

Source: https://github.com/facebook/react/blob/v19.2.0/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures/compiler/babel-existing-react-import.expect.md

This snippet demonstrates how to use React's `useMemo` hook to memoize the result of an expensive calculation within a functional component. It prevents re-running `calculateExpensiveNumber` unless its dependency `x` changes, optimizing performance. The `useState` hook manages the state `x` which is a dependency for the memoized value.

```javascript
import {useState, useMemo} from 'react';

function Component(props) {
  const [x] = useState(0);
  const expensiveNumber = useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

function Component2(props) {
  const [x] = useState(0);
  const expensiveNumber = useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}
```
