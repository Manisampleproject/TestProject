
import * as help from '../../helpers/apihelper.js';
import tags from 'mocha-tags-ultra';
import { assert, expect, should, chai, chaiHttp } from '../../resources/assertStyles.js';


let userid = [];

tags('smoke', 'regression')

describe.skip('validate User data', () => {
    it('TC1-Call api to get user details and save it inside an aray ', async () => {
        this.timeout(0);
        const accts = { Items: [{ fname: "john", lname: "parkins", zip: "12352" }, { fname: "david", lname: "parkins", zip: "52635" }, { fname: "victor", lname: "parkins", zip: "14562" },] }


        var number = 0;
        for (var i = 0; i < accts.Items.length; i++) {
            var fname = accts.Items[i].fname
            var lname = accts.Items[i].lname
            var zip = accts.Items[i].zip
            var mrn = help.getRandomstr(11)

            const resp = await help.callapi(fname, lname, zip, mrn);
            console.log("Response Body :", resp)
            expect(resp.data[0].id).to.equal('xxx');
            expect(resp.data[1].id).to.equal('yyy');
            expect(resp.data[2].id).to.equal('zzz');
            userid.push({ id: resp.data[0].id }, { name: resp.data[0].firstname });

            number++;
        }
        console.log("Number of user requests:", number)

    });

    it('TC2-place file in AWS s3 bucket and invoke lambda function', async function () {
        this.timeout(0);
        //Upload file into S3 bucket
        const upload = await help.uploadfiletoS3Bucket('FILE_NAME', '././testdata/testfile')
        sleep.sleep(4);
        //Invoke function from Lamda
        var params = {
            FunctionName: 'lambda function name',
            Payload: JSON.stringify({
                "ParameterName": value
            })
        };

        const invokelamda = await help.invokeLambda(params)

    });

    it("TC3-Query dynamotable and validate data", async () => {
        this.timeout(0);

        const accts = { Items: [{ acctkey: '123' }, { acctkey: '434' }, { acctkey: '345' }, { acctkey: '654' }] }

        for (var i = 0; i < accts.Items.length; i++) {
            var acct = accts.Items[i].acctkey
            sleep.sleep(5);
            const queryrecords = await help.getdynamoData(acct, "dynamoTablename")
            console.log("****queryrecords******:", queryrecords);

            for (var j = 0; j < queryrecords.Items.length; j++) {
                var id = queryrecords.Items[j].id;
                var name = queryrecords.Items[j].name;

                expect(queryrecords.Items[j].payment_type).to.equal('credit_card');
                expect(queryrecords.Items[j].transaction_type).to.equal('sale');
                expect(queryrecords.Items[j].record_type).to.equal('transaction');

                if (accountkey === '123') {

                    expect(queryrecords.Count).to.equal(4);
                }
                else if (accountkey === '434') {

                    expect(queryrecords.Count).to.equal(5);
                }
                else if (accountkey === '345') {

                    expect(queryrecords.Count).to.equal(6);
                }
                else {

                    expect(queryrecords.Count).to.equal(3);
                }

            }
        }

    });

})

describe('Sample tests', function () {
    tags('smoke', 'regression')
    describe('Sanity tests', function () {
        this.timeout(500);

        it('should take less than 500ms', function (done) {
            setTimeout(done, 300);
        });
        it('should take less than 500ms as well', function (done) {
            setTimeout(done, 250);
        });

    });
});


function add(args) {
    return args.reduce((prev, curr) => prev + curr, 0);
}

describe('add()', function () {
    const testAdd = ({ args, expected }) =>
        function () {
            const res = add(args);
            assert.strictEqual(res, expected);
        };

    it('correctly adds 2 args', testAdd({ args: [1, 2], expected: 3 }));
    it('correctly adds 3 args', testAdd({ args: [1, 2, 3], expected: 6 }));
    it('correctly adds 4 args', testAdd({ args: [1, 2, 3, 4], expected: 10 }));
});