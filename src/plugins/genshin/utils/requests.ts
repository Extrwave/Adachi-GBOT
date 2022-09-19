import request, { Response } from "request";

export interface IParams {
	[fieldName: string]: string | number
}

export function formatGetURL( url: string, params: IParams | undefined ): string {
	if ( !params ) return url;
	let paramsStr = "";
	for ( const key in params ) {
		paramsStr += `&${ key }=${ encodeURIComponent( params[key] ) }`;
	}
	return `${ url }?${ paramsStr.substring( 1 ) }`
}

export default async function requests( options: any ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( options, ( error: any, response: Response, body: any ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( body );
			}
		} );
	} )
		.catch( ( reason: any ) => {
			console.log( reason );
		} );
}