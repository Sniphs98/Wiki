export interface CustomIconMeta {
	id: string;
	name: string;
	mimeType: string;
	uploadedBy: string | null;
}

export interface CustomIconFile extends CustomIconMeta {
	data: Buffer;
}

export interface CreateCustomIconInput {
	name: string;
	mimeType: string;
	data: Buffer;
	uploadedBy?: string;
}
