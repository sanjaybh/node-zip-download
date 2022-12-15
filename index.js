'use strict';

const admZip = require('adm-zip');
const request = require('superagent');
const fs = require('fs');
const { exit } = require('process');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
var colors = require('colors');
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const currentDir = process.cwd();
const file_CDN_Path = 'https://cdn.fusioncharts.com/downloads/fc-versions-flutter';
let fcVersion = '3.18'; //Supported version - 3.17, 3.18. 3.19

function readInput(callback){
  readline.question('Which fusioncharts-core version are you looking out for [3.17, 3.18, 3.19] = '.green, (ver) => {
    if(ver == 3.17 || ver == 3.18 || ver == 3.19 ){
      fcVersion = ver;
    }else {
      console.log("That's incorrect, make sure you input correct version.".underline.red.bold);
      exit()
    }
    console.log(`Please wait while we process your request for ${fcVersion}...`.green)
    readline.close();
    callback(fcVersion);
  });
}

async function executeCDNFile(fcVersion){
  const fcCoreLocation = `${currentDir}/src/fc-core/`;

  const packageName = `${fcVersion}-fusioncharts-core`;
  const packageExt = ".zip";
  const packageFullNameExt = `${packageName}${packageExt}`;

  const downloadFileToTmpLoc = `${fcCoreLocation}/${packageFullNameExt}`;

  const fileSource = `${file_CDN_Path}/${packageFullNameExt}`;
  const extractEntryTo = `${fcCoreLocation}${packageFullNameExt}`;
  const outputDir = `${fcCoreLocation}/`;
  const oldFolderName = packageName;
  const newFolderName = fcVersion+'-fusioncharts';

  const folderAlreadyExists = `${fcCoreLocation}${newFolderName}`;

  //if version folder already exists
  if (fs.existsSync(folderAlreadyExists)) {
    console.log("Folder already present, deleting it...")
    fs.rmdirSync(folderAlreadyExists, { recursive: true });
    await sleep(3000);
  }

  //Send a request to pull file from CDN
  request
    .get(fileSource)
    .on('error', function(error) {
      console.log(error);
    })
    .pipe(fs.createWriteStream(downloadFileToTmpLoc))
    .on('finish', function() {
      console.log('finished dowloading'.cyan);

      var zip = new admZip(downloadFileToTmpLoc);
      console.log('start unzip'.cyan);

      zip.extractAllTo(outputDir);

      fs.unlink(extractEntryTo,function(err){
        if(err) return console.log(err);

        console.log('zip file deleted successfully'.cyan);

        fs.renameSync(outputDir+"/"+oldFolderName, outputDir+"/"+newFolderName)
      }); 

      console.log('finished unzip'.cyan.bold);
    });
}

//Execute your request
readInput(executeCDNFile);



