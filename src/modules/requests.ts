import request, { Response } from "request";

export interface IParams {
	[fieldName: string]: string | number
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

export async function requestResponse( options: any ): Promise<Response> {
	return new Promise( ( resolve, reject ) => {
		request( options, ( error: any, response: Response ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( response );
			}
		} );
	} )
		.catch( ( reason: any ) => {
			console.log( reason );
		} );
}

export function formatGetURL( url: string, params: IParams | undefined ): string {
	if ( !params ) return url;
	let paramsStr = "";
	for ( const key in params ) {
		paramsStr += `&${ key }=${ encodeURIComponent( params[key] ) }`;
	}
	return `${ url }?${ paramsStr.substring( 1 ) }`
}