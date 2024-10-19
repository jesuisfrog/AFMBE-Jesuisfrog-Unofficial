### 1.1.0

## Bug Fixes

- Fixed rule of 10 not applying modifiers
- Fixed bug when rolling with an un-edited weapon
- Fixed bug when rolling with an un-edited armor
- Removed weapon roll capability from observer sheet
- Added missing logic for qualities/drawbacks bonuses and penalties
- Added logic to prevent rule of one applying in a rule of ten streaks and vice-versa


## Changes

- Major styling overhaul
    - Light mode first, dark mode optional. Dark mode is limited to sheets and roll dialogs
    - Styling improvements of all sheets
    - Added Character Details and Contacts sections that were missing
    - Changed limited sheets to only show minimal information (Image, Name, Unrestricted Bio/Description)
- Sheet templates overhaul: All sheets are now using modular templates, preventing unnecessary repetitions
- Organized character template data: This is a breaking change for characters and creatures as the attributes are now nested under "primaryAttributes" and "secondaryAttributes" instead of at the root level of the character data and the description box content is now under "bio.biography" alongside all of the other character details
- Removed Aspects selection from creature rolls as these do not provide roll modifiers
- Removed unused field from vehicle weapons
- Added missing damage type field to vehicle weapon rolls
- Improved chat message rolls (Reorganized, color-coded, etc..)
- Added dynamically generated flavor text in several places


### 1.0.2

## Bug Fixes

- Fix equipment checkboxes' logic
- Fix Reset buttons for secondary attribute pools

### 1.0

## Bug Fixes

- Fix being unable to edit items on PC sheets
- Removed delete button on item categories (bugged and unnecessary) 
- Fix rolls not working

## Changes

- Addressed multiple deprecations
- Added a damage multiplier modifier (Needed as weapons can add a modifier to the characteristic used for damage and there was no way to represent that)