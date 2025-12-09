---
query_date: 2025-12-09 20:02:33 UTC
library: /websites/radix-ui-primitives
topic: Popover component API
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: Popover component API

### Popover Content API

Source: https://www.radix-ui.com/primitives/docs/components/popover

The component that pops out when the popover is open. It accepts various props to control its behavior, positioning, and appearance.

```APIDOC
## Popover.Content API

### Description
The component that pops out when the popover is open.

### Props

#### Path Parameters
- **asChild** (boolean) - Optional - Prop description. Default: `false`
- **onOpenAutoFocus** (function) - Optional - Prop description. See full type. No default value
- **onCloseAutoFocus** (function) - Optional - Prop description. See full type. No default value
- **onEscapeKeyDown** (function) - Optional - Prop description. See full type. No default value
- **onPointerDownOutside** (function) - Optional - Prop description. See full type. No default value
- **onFocusOutside** (function) - Optional - Prop description. See full type. No default value
- **onInteractOutside** (function) - Optional - Prop description. See full type. No default value
- **forceMount** (boolean) - Optional - Prop description. No default value
- **side** (enum) - Optional - Prop description. See full type. Default: `"bottom"`
- **sideOffset** (number) - Optional - Prop description. Default: `0`
- **align** (enum) - Optional - Prop description. See full type. Default: `"center"`
- **alignOffset** (number) - Optional - Prop description. Default: `0`
- **avoidCollisions** (boolean) - Optional - Prop description. Default: `true`
- **collisionBoundary** (Boundary) - Optional - Prop description. See full type. Default: `[]`
- **collisionPadding** (number | Padding) - Optional - Prop description. See full type. Default: `0`
- **arrowPadding** (number) - Optional - Prop description. Default: `0`
- **sticky** (enum) - Optional - Prop description. See full type. Default: `"partial"`
- **hideWhenDetached** (boolean) - Optional - Prop description. Default: `false`

### Data Attributes

- **[data-state]**: `"open"` | `"closed"`
- **[data-side]**: `"left"` | `"right"` | `"bottom"` | `"top"`
- **[data-align]**: `"start"` | `"end"` | `"center"`

### CSS Variables

- **--radix-popover-content-transform-origin**: The `transform-origin` computed from the content and arrow positions/offsets
- **--radix-popover-content-available-width**: The remaining width between the trigger and the boundary edge
- **--radix-popover-content-available-height**: The remaining height between the trigger and the boundary edge
- **--radix-popover-trigger-width**: The width of the trigger
- **--radix-popover-trigger-height**: The height of the trigger
```

--------------------------------

### Custom Radix UI Popover API Implementation (React JSX)

Source: https://www.radix-ui.com/primitives/docs/components/popover

This example shows how to create a custom Popover API by abstracting Radix UI's primitive parts into a reusable component. It demonstrates configuring default props like `sideOffset` for `Popover.Content` and including a `Popover.Arrow`. This approach promotes consistency and simplifies the usage of Popovers throughout an application.

```jsx
import { Popover, PopoverTrigger, PopoverContent } from "./your-popover";



export default () => (

	<Popover>

		<PopoverTrigger>Popover trigger</PopoverTrigger>

		<PopoverContent>Popover content</PopoverContent>

	</Popover>

);
```

```jsx
// your-popover.jsx

import * as React from "react";

import { Popover as PopoverPrimitive } from "radix-ui";



export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = PopoverPrimitive.Trigger;



export const PopoverContent = React.forwardRef(

	({ children, ...props }, forwardedRef) => (

		<PopoverPrimitive.Portal>

			<PopoverPrimitive.Content sideOffset={5} {...props} ref={forwardedRef}>

				{children}

				<PopoverPrimitive.Arrow />

			</PopoverPrimitive.Content>

		</PopoverPrimitive.Portal>

	),

);
```

--------------------------------

### Popover Arrow API

Source: https://www.radix-ui.com/primitives/docs/components/popover

An optional arrow element to render alongside the popover. This can be used to help visually link the anchor with the Popover.Content. Must be rendered inside Popover.Content.

```APIDOC
## Popover.Arrow API

### Description
An optional arrow element to render alongside the popover. This can be used to help visually link the anchor with the `Popover.Content`. Must be rendered inside `Popover.Content`.

### Props

#### Path Parameters
- **asChild** (boolean) - Optional - Prop description. Default: `false`
- **width** (number) - Optional - Prop description. Default: `10`
- **height** (number) - Optional - Prop description. Default: `5`
```

--------------------------------

### Popover Close API

Source: https://www.radix-ui.com/primitives/docs/components/popover

The button that closes an open popover. It accepts the `asChild` prop to allow for composition.

```APIDOC
## Popover.Close API

### Description
The button that closes an open popover.

### Props

#### Path Parameters
- **asChild** (boolean) - Optional - Prop description. Default: `false`
```

--------------------------------

### Popover Component Usage

Source: https://www.radix-ui.com/primitives/docs/components/popover

Example of how to use the Popover component in a React application.

```APIDOC
## Popover Component

Displays rich content in a portal, triggered by a button.

### Features

* Can be controlled or uncontrolled.
* Customize side, alignment, offsets, collision handling.
* Optionally render a pointing arrow.
* Focus is fully managed and customizable.
* Supports modal and non-modal modes.
* Dismissing and layering behavior is highly customizable.

### Installation

```bash
npm install @radix-ui/react-popover
```

### Anatomy

Import all parts and piece them together.

```javascript
import { Popover } from "radix-ui";

export default () => (
    <Popover.Root>
        <Popover.Trigger />
        <Popover.Anchor />
        <Popover.Portal>
            <Popover.Content>
                <Popover.Close />
                <Popover.Arrow />
            </Popover.Content>
        </Popover.Portal>
    </Popover.Root>
);
```

### API Reference

#### Root

Contains all the parts of a popover.

| Prop            | Type     | Default     |
| --------------- | -------- | ----------- |
| `defaultOpen`   | `boolean`| No default value |
| `open`          | `boolean`| No default value |
| `onOpenChange`  | `function`| No default value |
| `modal`         | `boolean`| `false`     |

#### Trigger

The button that toggles the popover. By default, the `Popover.Content` will position itself against the trigger.

| Prop     | Type     | Default |
| -------- | -------- | ------- |
| `asChild`| `boolean`| `false` |

`[data-state]` | `"open" | "closed"`

#### Anchor

An optional element to position the `Popover.Content` against. If this part is not used, the content will position alongside the `Popover.Trigger`.

| Prop     | Type     | Default |
| -------- | -------- | ------- |
| `asChild`| `boolean`| `false` |

#### Portal

When used, portals the content part into the `body`.

| Prop         | Type         | Default     |
| ------------ | ------------ | ----------- |
| `forceMount` | `boolean`    | No default value |
| `container`  | `HTMLElement`| `document.body` |
```

--------------------------------

### Radix UI Popover Anatomy Structure

Source: https://www.radix-ui.com/primitives/docs/components/popover

Illustrates the basic structure and import mechanism for the Radix UI Popover component. It shows how to import all necessary parts and assemble them into a functional popover. This is useful for understanding the component's composition.

```jsx
import { Popover } from "radix-ui";



export default () => (

	<Popover.Root>

		<Popover.Trigger />

		<Popover.Anchor />

		<Popover.Portal>

			<Popover.Content>

				<Popover.Close />

				<Popover.Arrow />

			</Popover.Content>

		</Popover.Portal>

	</Popover.Root>

);

```

--------------------------------

### Popover Component Setup - React

Source: https://www.radix-ui.com/primitives/docs/components/popover

Basic setup for the Radix UI Popover component using React. It includes the root, trigger, portal, and content elements. No external dependencies beyond React and Radix UI are explicitly mentioned for this snippet.

```jsx
import { Popover } from "radix-ui";
import "./styles.css";

export default () => (
	<Popover.Root>
		<Popover.Trigger>…</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content className="PopoverContent" sideOffset={5}>
				…
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
);
```

--------------------------------

### Implement Popover Component with Radix UI

Source: https://www.radix-ui.com/primitives/docs/overview/getting-started

This React code snippet demonstrates the basic structure for importing and using the Popover component from Radix UI. It includes the root, trigger, portal, content, and arrow parts of the Popover.

```jsx
import * as React from "react";

import { Popover } from "radix-ui";



const PopoverDemo = () => (

	<Popover.Root>

		<Popover.Trigger>More info</Popover.Trigger>

		<Popover.Portal>

			<Popover.Content>

				Some more info…

				<Popover.Arrow />

			</Popover.Content>

		</Popover.Portal>

	</Popover.Root>

);



export default PopoverDemo;
```

--------------------------------

### React Popover Component Implementation

Source: https://www.radix-ui.com/primitives/docs/components/popover

Demonstrates the implementation of a basic Popover component using Radix UI Primitives in React. It includes the root, trigger, portal, content, close button, and arrow, along with input fields for demonstration purposes. This snippet requires React and Radix UI dependencies.

```jsx
import * as React from "react";

import { Popover } from "radix-ui";

import { MixerHorizontalIcon, Cross2Icon } from "@radix-ui/react-icons";

import "./styles.css";



const PopoverDemo = () => (

	<Popover.Root>

		<Popover.Trigger asChild>

			<button className="IconButton" aria-label="Update dimensions">

				<MixerHorizontalIcon />

			</button>

		</Popover.Trigger>

		<Popover.Portal>

			<Popover.Content className="PopoverContent" sideOffset={5}>

				<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

					<p className="Text" style={{ marginBottom: 10 }}>

						Dimensions

					</p>

					<fieldset className="Fieldset">

						<label className="Label" htmlFor="width">

							Width

						</label>

						<input className="Input" id="width" defaultValue="100%" />

					</fieldset>

					<fieldset className="Fieldset">

						<label className="Label" htmlFor="maxWidth">

							Max. width

						</label>

						<input className="Input" id="maxWidth" defaultValue="300px" />

					</fieldset>

					<fieldset className="Fieldset">

						<label className="Label" htmlFor="height">

							Height

						</label>

						<input className="Input" id="height" defaultValue="25px" />

					</fieldset>

					<fieldset className="Fieldset">

						<label className="Label" htmlFor="maxHeight">

							Max. height

						</label>

						<input className="Input" id="maxHeight" defaultValue="none" />

					</fieldset>

				</div>

				<Popover.Close className="PopoverClose" aria-label="Close">

					<Cross2Icon />

				</Popover.Close>

				<Popover.Arrow className="PopoverArrow" />

			</Popover.Content>

		</Popover.Portal>

	</Popover.Root>

);



export default PopoverDemo;

```

--------------------------------

### Style Popover Component with Radix UI

Source: https://www.radix-ui.com/primitives/docs/overview/getting-started

This React code snippet shows how to add CSS classes to the Popover component parts for custom styling. It imports the necessary components and a CSS file.

```jsx
import * as React from "react";

import { Popover } from "radix-ui";

import "./styles.css";



const PopoverDemo = () => (

	<Popover.Root>

		<Popover.Trigger className="PopoverTrigger">Show info</Popover.Trigger>

		<Popover.Portal>

			<Popover.Content className="PopoverContent">

				Some content

				<Popover.Arrow className="PopoverArrow" />

			</Popover.Content>

		</Popover.Portal>

	</Popover.Root>

);



export default PopoverDemo;
```
