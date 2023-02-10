export interface SignInInfo {
	type: "sign-in-info";
	totalSignDay: number;
	today: string;
	isSign: boolean;
	isSub: boolean;
	firstBind: boolean;
	monthFirst: boolean;
	signCntMissed: boolean;
}

export interface SignInResult {
	type: "sign-in-result";
	code: string;
	riskCode: number;
	gt: string;
	challenge: string;
	success: number;
}

export interface SignInAward {
	type: "sign-in-award";
	month: number,
	awards: Award[]
}

export interface Award {
	name: string,
	cnt: number,
	icon: string
}