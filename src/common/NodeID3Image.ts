export interface NodeID3Image {
	mime: string;
	type: {
		id: number;
		name: string;
	};
	description: string;
	imageBuffer: Buffer;
}
