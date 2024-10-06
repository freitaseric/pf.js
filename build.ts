import fs from "node:fs";
import path from "node:path";

async function build() {
	const result = await Bun.build({
		entrypoints: ["./src/index.ts"],
		minify: true,
		outdir: "./build/",
		target: "node",
		packages: "bundle",
		plugins: [
			{
				name: "Clean Install",
				setup: ({ config }) => {
					const outdir = config.outdir ?? "./build/";

					if (fs.existsSync(outdir)) {
						fs.rmSync(outdir, {
							recursive: true,
							force: true,
						});
					}
				},
			},
			{
				name: "Copy DTS files",
				target: "node",
				setup: ({ config }) => {
					const dtsFiles = fs
						.readdirSync(path.dirname(config.entrypoints[0]), {
							recursive: true,
							withFileTypes: true,
						})
						.filter((entry) => entry.isFile() && entry.name.endsWith(".d.ts"))
						.map((entry) => `src/${entry}`);

					for (const dtsFile of dtsFiles) {
						fs.cpSync(dtsFile, dtsFile.replace("src/", "build/"));
					}
				},
			},
		],
	});

	if (result.success) {
		console.log("Bundle successfully completed!");
		console.log(`Bundled ${result.outputs.length} files.`);
	} else {
		for (const log of result.logs) {
			const now = new Date();
			console.log(
				`[${log.level.toUpperCase()}] ${log.name} at ${now.toLocaleTimeString("pt-br")} - ${log.message}`,
			);
		}
		process.exit(1);
	}
}

build();
