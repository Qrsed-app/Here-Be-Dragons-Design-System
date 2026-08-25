"use client";

// Avatar uses useState/useEffect (image-load fallback) without a 'use client'
// directive of its own, so it cannot render inside server MDX. These thin client
// wrappers host the static AvatarGroup examples so the hooks run on the client.

import { Avatar } from "@/registry/new-york/avatar/avatar";
import { AvatarGroup } from "@/registry/new-york/avatar-group/avatar-group";

/** A small group, no overflow bubble. */
export function AvatarGroupBasicDemo() {
  return (
    <AvatarGroup>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Alan Turing" />
      <Avatar name="Grace Hopper" />
    </AvatarGroup>
  );
}

/** More avatars than `max` — extras collapse into a +N bubble. */
export function AvatarGroupOverflowDemo() {
  return (
    <AvatarGroup max={3}>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Alan Turing" />
      <Avatar name="Grace Hopper" />
      <Avatar name="Katherine Johnson" />
      <Avatar name="Margaret Hamilton" />
      <Avatar name="Dorothy Vaughan" />
    </AvatarGroup>
  );
}

/** `size` propagates to every child avatar and the overflow bubble. */
export function AvatarGroupSizesDemo() {
  return (
    <>
      <AvatarGroup size="sm" max={3}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Alan Turing" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </AvatarGroup>
      <AvatarGroup size="lg" max={3}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Alan Turing" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
      </AvatarGroup>
    </>
  );
}

/** Children with images; missing images fall back to the generic icon. */
export function AvatarGroupImagesDemo() {
  return (
    <AvatarGroup max={4}>
      <Avatar name="Ada Lovelace" imgSrc="https://i.pravatar.cc/96?img=1" />
      <Avatar name="Alan Turing" imgSrc="https://i.pravatar.cc/96?img=2" />
      <Avatar name="Grace Hopper" imgSrc="https://i.pravatar.cc/96?img=3" />
      <Avatar name="Katherine Johnson" />
      <Avatar name="Margaret Hamilton" />
    </AvatarGroup>
  );
}
