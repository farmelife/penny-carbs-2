

## Fix: Block Cloud Kitchen Items Without Assigned Cooks

**Problem**: Cloud kitchen items (like "Carbs Brost Chicken Mega Offer @299/-") are visible and orderable by customers even when no cook is assigned to that item. Only homemade items currently check for cook allocation — cloud kitchen items only check if the division/slot is active.

**Root Cause**: Multiple customer-facing components filter homemade items by cook allocation but skip that check for cloud kitchen items.

### Changes Required

**1. FeaturedItems (`src/components/customer/FeaturedItems.tsx`)**
- Add cook allocation check for `cloud_kitchen` items alongside the existing `homemade` check
- If a cloud kitchen item has no cook allocated (not in `allocatedIds`), filter it out

**2. PopularItems (`src/components/customer/PopularItems.tsx`)**
- Same fix: after the active slot check for cloud kitchen items, also verify the item has at least one allocated cook via `allocatedIds`

**3. Menu page (`src/pages/Menu.tsx`)**
- Extend the homemade cook-allocation filter to also apply to cloud kitchen items
- Items of type `cloud_kitchen` without any cook allocation should be hidden

**4. ItemDetail page (`src/pages/ItemDetail.tsx`)**
- Extend the cook availability check (currently homemade-only) to also apply to cloud kitchen items
- Fetch cook_dishes for cloud kitchen items the same way as homemade
- Show "No Cooks Available" disabled button when a cloud kitchen item has no cooks assigned (for the customer's panchayat)

### Technical Detail

The existing `useCookAllocatedItemIds` hook already fetches all `cook_dishes` regardless of service type and filters by active/available cooks and panchayat. So the allocated IDs set already contains cloud kitchen items that have cooks — we just need to use it for filtering cloud kitchen items too.

In each component, the change is small: where we currently have:
```
if (item.service_type === 'homemade' && allocatedIds) {
  return allocatedIds.has(item.id);
}
```
We add cloud_kitchen to the same check:
```
if ((item.service_type === 'homemade' || item.service_type === 'cloud_kitchen') && allocatedIds) {
  return allocatedIds.has(item.id);
}
```

For ItemDetail, we extend the cook-fetching logic (lines 77-131) to also run for cloud kitchen items, and extend `noCooksAvailable` to cover both service types.

