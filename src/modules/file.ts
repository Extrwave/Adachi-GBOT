/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import { resolve } from "path"
import { set } from "object-immutable-set";
import { parse, stringify } from "yaml";
import * as fs from "fs";

export type PresetPlace = "config" | "plugin" | "data" | "root";

type Tuple<T, N extends number, L extends any[] = []> =
	L["length"] extends N ? L : Tuple<T, N, [ ...L, T ]>;
type Union<T, N extends number, L extends any[] = [ T ]> =
	L["length"] extends N ? L[number] : Union<T, N, [ ...L, Tuple<T, L["length"]> ]>;
type UpdateIndex = Union<string, 10>;

interface ManagementMethod {
	isExist( path: string ): boolean;
	
	getFilePath( path: string, place?: PresetPlace ): string;
	
	renameFile( fileName: string, newName: string, place?: PresetPlace ): void;
	
	readFile( fileName: string, place: PresetPlace ): string;
	
	readFileByStream( fileName: string, place: PresetPlace, highWaterMark?: number ): Promise<string>;
	
	createDir( dirName: string, place?: PresetPlace ): boolean;
	
	getDirFiles( dirName: string, place?: PresetPlace ): string[];
	
	createYAML( ymlName: string, data: any, place?: PresetPlace ): boolean;
	
	loadYAML( ymlName: string, place?: PresetPlace ): any;
	
	writeYAML( ymlName: string, data: any, place?: PresetPlace ): void;
	
	updateYAML( ymlName: string, data: any, place?: PresetPlace, ...index: string[] ): void;
	
}

export default class FileManagement implements ManagementMethod {
	public readonly root: string;
	public readonly config: string;
	public readonly plugin: string;
	public readonly data: string;
	
	constructor( root: string ) {
		this.root = root;
		this.config = resolve( root, "config" );
		this.data = resolve( root, "data" );
		this.plugin = resolve( root, "src/plugins" );
	}
	
	public isExist( path: string ): boolean {
		try {
			fs.accessSync( path );
			return true;
		} catch ( error ) {
			return false;
		}
	}
	
	public getFilePath( path: string, place: PresetPlace = "config" ): string {
		let h;
		if ( place === "config" )
			h = this.config;
		else if ( place === "plugin" )
			h = this.plugin;
		else if ( place === "data" )
			h = this.data;
		else
			h = this.root;
		return resolve( h, path );
	}
	
	public renameFile( fileName: string, newName: string, place: PresetPlace = "config" ): void {
		const oldPath: string = this.getFilePath( fileName, place );
		const newPath: string = this.getFilePath( newName, place );
		fs.renameSync( oldPath, newPath );
	}
	
	public readFile( fileName: string, place: PresetPlace ): string {
		const path: string = this.getFilePath( fileName, place );
		return fs.readFileSync( path, "utf-8" );
	}
	
	public readFileByStream( fileName: string, place: PresetPlace, highWaterMark: number = 64 ): Promise<string> {
		return new Promise( ( resolve, reject ) => {
			const path: string = this.getFilePath( fileName, place );
			const rs = fs.createReadStream( path, { highWaterMark: highWaterMark * 1024 } );
			const dataList: Buffer[] = [];
			rs.on( "data", ( chunk ) => {
				dataList.push( <Buffer>chunk );
			} );
			rs.on( "end", () => {
				const data = Buffer.concat( dataList ).toString( "utf-8" );
				resolve( data );
			} )
			rs.on( "error", ( error ) => {
				reject( error );
			} );
		} )
	}
	
	public createDir( dirName: string, place: PresetPlace = "config" ): boolean {
		const path: string = this.getFilePath( dirName, place );
		const exist: boolean = this.isExist( path );
		if ( !exist ) {
			fs.mkdirSync( path );
		}
		return exist;
	}
	
	public getDirFiles( dirName: string, place: PresetPlace = "config" ): string[] {
		const path: string = this.getFilePath( dirName, place );
		return fs.readdirSync( path );
	}
	
	public createYAML( ymlName: string, data: any, place: PresetPlace = "config" ): boolean {
		const path: string = this.getFilePath( ymlName, place ) + ".yml";
		const exist: boolean = this.isExist( path );
		if ( !exist ) {
			this.writeYAML( ymlName, data, place );
		}
		return exist;
	}
	
	public loadYAML( ymlName: string, place: PresetPlace = "config" ): any {
		const path: string = this.getFilePath( ymlName, place ) + ".yml";
		const file: string = fs.readFileSync( path, "utf-8" );
		return parse( file ) || {};
	}
	
	public writeYAML( ymlName: string, data: any, place: PresetPlace = "config" ): void {
		const path: string = this.getFilePath( ymlName, place ) + ".yml";
		const opened: number = fs.openSync( path, "w" );
		fs.writeSync( opened, stringify( data ) );
		fs.closeSync( opened );
	}
	
	public updateYAML(
		ymlName: string,
		data: any,
		place: PresetPlace = "config",
		...index: string[]
	): void {
		const oldData: any = this.loadYAML( ymlName, place );
		// @ts-ignore
		const newData: any = set( oldData, index, data );
		this.writeYAML( ymlName, newData, place );
	}
}