import { EnKaEquip, EnKaWeaponEquip } from "#mari-plugin/types/EnKa";

export function isEnKaWeaponEquip(equip: EnKaEquip): equip is EnKaWeaponEquip {
	return equip.flat.itemType !== "ITEM_WEAPON";
}