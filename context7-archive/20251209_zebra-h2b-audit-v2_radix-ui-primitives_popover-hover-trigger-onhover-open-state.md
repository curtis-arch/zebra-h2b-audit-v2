---
query_date: 2025-12-09 20:26:51 UTC
library: /websites/radix-ui-primitives
topic: Popover hover trigger onHover open state
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: Popover hover trigger onHover open state

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

### Custom Anchor for Radix UI Popover (JSX & CSS)

Source: https://www.radix-ui.com/primitives/docs/components/popover

This example demonstrates how to anchor a Radix UI Popover's content to an element other than its trigger. It uses the `Popover.Anchor` component, allowing for more flexible UI layouts where the Popover can be associated with a specific part of the DOM. Basic CSS is included to style the anchor element.

```jsx
import { Popover } from "radix-ui";

import "./styles.css";



export default () => (

	<Popover.Root>

		<Popover.Anchor asChild>

			<div className="Row">

				Row as anchor <Popover.Trigger>Trigger</Popover.Trigger>

			</div>

		</Popover.Anchor>



		<Popover.Portal>

			<Popover.Content>…</Popover.Content>

		</Popover.Portal>

	</Popover.Root>

);
```

```css
/* styles.css */

.Row {
	background-color: gainsboro;
	padding: 20px;

}
```

--------------------------------

### Display Hover Card Instantly with Radix UI

Source: https://www.radix-ui.com/primitives/docs/components/hover-card

This example demonstrates how to make the Hover Card appear instantly by setting the `openDelay` prop to 0. It requires importing `HoverCard` from 'radix-ui' and includes basic JSX structure for the root, trigger, and content components.

```jsx
import { HoverCard } from "radix-ui";



export default () => (

	<HoverCard.Root openDelay={0}>

		<HoverCard.Trigger>…</HoverCard.Trigger>

		<HoverCard.Content>…</HoverCard.Content>

	</HoverCard.Root>

);
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

### Create Popovers with Automatic Positioning using Radix UI

Source: https://context7.com/context7/radix-ui-primitives/llms.txt

This example shows how to create popovers with automatic positioning and collision detection using Radix UI's Popover component. The popover content is automatically placed relative to its trigger, ensuring visibility even when near viewport edges. It requires React and Radix UI.

```jsx
import * as React from "react";
import { Popover } from "radix-ui";
import "./styles.css";

const PopoverDemo = () => (
  <Popover.Root>
    <Popover.Trigger className="PopoverTrigger">More info</Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="PopoverContent" sideOffset={5}>
        Some more info…
        <Popover.Arrow className="PopoverArrow" />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

export default PopoverDemo;

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

### Constrain the content size

Source: https://www.radix-ui.com/primitives/docs/components/popover

Example demonstrating how to constrain the popover content's size to match the trigger width and not exceed the viewport height using CSS custom properties.

```APIDOC
## Constrain the content size

### Description
You may want to constrain the width of the content so that it matches the trigger width. You may also want to constrain its height to not exceed the viewport. We expose several CSS custom properties such as `--radix-popover-trigger-width` and `--radix-popover-content-available-height` to support this. Use them to constrain the content dimensions.

### Request Example

```jsx
// index.jsx

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

### Response Example

```css
/* styles.css */

.PopoverContent {

	width: var(--radix-popover-trigger-width);

	max-height: var(--radix-popover-content-available-height);

}
```
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

### Hover Card API Reference - Trigger

Source: https://www.radix-ui.com/primitives/docs/components/hover-card

API details for the Trigger component of the Hover Card.
