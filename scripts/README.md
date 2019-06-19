# scripts

There is one directory per dataset required to power the tool. Each one contains scripts to `download` the datasets and `process` them if necessary. Note that all `download` scripts point to URLs that are subject to change. Specific steps per dataset are listed below, as well as instructions for configuring your environment to run the scripts.

## Environment

For **bash** scripts, both Linux and MacOS should support them natively. If running Windows, check out the [Subsystem for Linux Installation guide](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

Some scripts rely on Python and [GDAL](https://gdal.org/) for conversion. To use these tools on MacOS, it is recommended you install [homebrew](https://brew.sh/). To install, follow guidance in []().

For **Node.js** scripts, refer to the [Node.js Downloads page](https://nodejs.org/en/download/) and select your OS. Some Node.js scripts require NPM be installed, follow guidance [here](https://docs.npmjs.com/creating-a-new-npm-user-account) to create an NPM account and [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for install and setup.

## Datasets

In order to work with the dataset scripts, you must first have a local copy of the [`waba-add-a-bike-lane`](https://github.com/mapbox/waba-add-a-bike-lane) GitHub repository. This can be obtained using `git clone` (for instructions on how to install and use GitHub, see their ['Set up Git' guide](https://help.github.com/en/articles/set-up-git)) _or_ downloaded directly with the 'Clone or Download' button by selecting the 'Download ZIP' option.

#### census

Data sourced from [United States Census Bureau](https://www.census.gov/).

This set of scripts downloads and processes DC census block data into a GeoJSON feature collection suitable for upload to Mapbox. The final dataset is saved as `census.geojson` in the `data` folder.

1. Navigate to the `census` directory (`cd scripts/census`)
2. Run the bash script `download.sh` using the command `bash download.sh`
3. Run the bash script `process.sh` using the command `bash process.sh`

#### crashes

Data sourced from [Open Data DC](https://opendata.dc.gov/).

This set of scripts downloads and processes DC crash data into a filtered CSV of incidents involving pedestrians and cyclists suitable for upload to Mapbox. The final data is saved as `crashes.csv` in the `data` folder.

1. Navigate to the `crashes` directory (`cd scripts/crashes`)
2. Run the bash script `download.sh` using the command `sh download.sh`
3. Run the Node.js script `process.js` using the command `node process.js`

#### lanes

TBA

