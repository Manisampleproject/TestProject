import AWS from 'aws-sdk';

const gotInstance = require('../utils/gotInstance')
const tdata = require('../resources/TestData/tdata')
const { faker } = require('@faker-js/faker');


//Generate random sting
const getRandomstr = (n) => {
    return faker.random.alphaNumeric(n);
};

//call dummyapi
const callapi = async (fname, lname, zip, mrn) => {


    const body = {
        "initiator": "customer",

        "user_info": {
            "first_name": fname,
            "last_name": lname,
            "refnum": mrn,
            "billing_address": {
                "address_line_1": "123 test st",
                "city": "Atlanta",
                "state": "GA",
                "country_code": "US",
                "postal_code": zip
            }
        },

    };

    try {
        const testapi = await gotInstance().get(tdata.apiurl,
            {
                json: body,
                headers: {

                    "Content-Type": "application/json",
                },

            })

        return testapi.data


    } catch (error) {
        return (JSON.parse(error.response.body))
    }


}

// Upload file into s3 bucket
// to Connect to AWS console, configure aws credentials locally or configure AWS Vault to access the credentials and configuration in secure way
const uploadeMAFtoS3Bucket = async function (name, path, basePath = 'test/folder1/folder2') {
    const bucketName = `S3bucketname${basePath}`;
    const fileName = name;
    const file = path;
    const fileData = fs.readFileSync(file);
    let params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileData,
    };
    try {
        let uploadPromise = await new AWS.S3().putObject(params).promise();
        console.log('Successfully uploaded file into S3 bucket');
    } catch (e) {
        console.log('Error uploading data: ', e);
    }
};


//Invoke Lamda function

const invokeLambda = async function (params) {
    var lamda = new AWS.Lambda();
    try {
        const resp = await lamda.invoke(params).promise();
        console.log('Lambda function successful'); // successful response
    } catch (err) {
        console.log('error occured in lambda', err); // successful response
    }
};

//Query AWS aynamo table
const getdynamoData = async (accesskey, tableName) => {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: tableName,
        IndexName: 'name_of_the_index',
        KeyConditionExpression: 'id = :searchKeyvalue',
        ExpressionAttributeValues: {
            ':searchKeyvalue': accesskey,
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        //We need to get all the data from payment settlement table to add the validations for the fees and statuses
        ProjectionExpression:
            'id,name,payment_type,transaction_type,record_typeaddress,city,state,amount,etc',
    };
    const items = await docClient.query(params).promise();

    return items;


};


export { getRandomstr };
export { callapi }; 
export {uploadeMAFtoS3Bucket};
export { invokeLambda };
export { getdynamoData };

