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
const _minZipFolderSize = 1500;

const currentDir = process.cwd();
const file_CDN_Path = 'https://cdn.fusioncharts.com/downloads/fc-versions-flutter';
let fcVersion = false;


//==========================================\\
function readInput(verAry, callback){
    readline.question('Which fusioncharts-core version are you looking out for ['+verAry+'] = '.green, (ver) => {
        //if(ver == 3.17 || ver == 3.18 || ver == 3.19 ){}
        if(verAry.includes(ver)){
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

async function executeCDNFile(){
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
      console.log('finished dowloading said package...'.cyan);
      const {size} = fs.statSync(downloadFileToTmpLoc);
      if(size < _minZipFolderSize){
        console.log("That's incorrect, package dosent seem to be correct.".underline.red.bold);

        fs.unlink(extractEntryTo,function(err){
            if(err) return console.log(err);
            console.log('zip package deleted successfully'.cyan);
            exit();
        });
      }else {
        var zip = new admZip(downloadFileToTmpLoc);
        console.log('start unzipping package'.cyan);
        zip.extractAllTo(outputDir);
        fs.unlink(extractEntryTo,function(err){
        if(err) return console.log(err);
        console.log('zip file deleted successfully'.cyan);
        fs.renameSync(outputDir+"/"+oldFolderName, outputDir+"/"+newFolderName)
        }); 
        console.log('finished unzipping package'.cyan.bold);
      }      
    });
}

async function getFile(sourcePath, filename, callback){
  const localPath = currentDir+"/src/fc-core/"+filename;
  request
  .get(sourcePath)
  .on('error', function(error) {
    console.log("ERROR - "+error);
  })
  .pipe(fs.createWriteStream(localPath))
  .on('finish', async function() {
    console.log('supported versions text file dowloading'.cyan);

    await sleep(3000);
    readSupportedVersionFile(localPath);
  });
}

async function readSupportedVersionFile(localPath){
    //console.log("localPath - ", localPath)
    fs.readFile(localPath, 'utf8', await function(err, stringData){
        const jsonObj = JSON.parse(stringData);
        const verAry = [];
        const supVersionsLength = jsonObj.supportVersion.length;
        //console.log("supVersionsLength...", supVersionsLength);
        for (const key in jsonObj.supportVersion) {
            //console.log("Val - ", `${jsonObj.supportVersion[key].version}`)
            verAry.push(`${jsonObj.supportVersion[key].version}`)
        }
        if(supVersionsLength <= 0){
            console.log("No Record found...", supVersionsLength);
            exit();
        }else{
            //console.log("verAry...", verAry);
            //TODO - Load function - Read json object and start downloading specified version
            readInput(verAry, executeCDNFile);
        }
    });
}

const verAvailFile_filename = "supportedVersions.txt";
const verAvailFile_CDN_Path = file_CDN_Path+'/'+verAvailFile_filename;
//console.log(verAvailFile_CDN_Path)
getFile(verAvailFile_CDN_Path, verAvailFile_filename)

//Temp
//const localPath1 = currentDir+"/src/fc-core/"+verAvailFile_filename;
//readSupportedVersionFile(localPath1);