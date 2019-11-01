const crypto = require('crypto')
const http = require('http')

const hostname = 'localhost'
const port = 3000
const shopUrl = `http://${hostname}:${port}` 
const shop_merchant_agreement_code = 'demo-merchant-agreement'
const shop_cancel_url = shopUrl+'/cancel'
const shop_receipt_url = shopUrl+'/receipt'
const paymentEndPointUrl = 'https://epayment.test.point.fi/pw/payment'
const payPagePublicKey = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDI8vxSTVxqonuAIychHe0AVkXG\nxZN2WBUHYCsbGVrgbfp154u5rPNjYY6G74iBwi+rDh+c4yZosmHS6Hama/pWrxKs\nYYsmv1+g3OMmr3u4zoI1rHwWjBIt+lPmntzeLlrJ9jqXvTANiO0Oq1UsC1jVK9Oi\nMMth6mcnJhfCYUJT4QIDAQAB\n-----END PUBLIC KEY-----"
const shopPrivateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQDAAhhbtLXNtpnT561hLZKJy4cEZYkWW7JVNfN58Is+9UBFEPbI\nP3WM2WKNVLUW7AEBWuQa6IdFoP/5adl+pGZ4MDSKdvb3XUiz768dt2rFtPyEKQbp\n7/MGx3HNweEoq4ajoZdZz8kK9xZ6WsEVBSP118MKAVuEdMk8o9U4HUCamQIDAQAB\nAoGARVa8WynIWdCufpL0zto5SB/C03ijZ/qXTSRdl9ShRIwmuIpmxGv+VG4Qo/9K\nIkv6FPYw1/LPHvsEVZq/G3fdNLv20Zg7O9zmOdnO3oY267snetJmym81VVa6Tq3p\nuIJnxyD2UOzj61Fy/fRPnpBs2ftu7/HabQc0ZFm9qKgVo90CQQDgsO/InlJ79/J0\npiNjRBDVNv+UzNqg8OiIhis+tl0YgBbCGFy4zTBT8qi8z6F8Nly2Z5dXnhJP0M7I\necknB8LPAkEA2sNPD4PVliYebbY8p/cik6bdDOydGDaQCY3vjAAIM2nJxi4XZNVo\nuNtJxCGC7/xQuxBodE0gQ//HTJNy937GFwJACorixVQAZMaufqCo+mhgLdDlzxKJ\nk5GaJ4W8E7Y0ygiAiNzhxN4DzXyOREWtuwlF8l0L8dV94HbYrPlh4c3wawJBAI9l\nvRpPcZ81p3aFIWd8oOamV3nUU/l+MpaAuohLsRR6gK/uoJkRJs8dt1HgIaNMAmNM\nkxvBPqg0LqDsekzvhcsCQQC6qL5RMuXgf/J90TAvtL9KdQ+EBbZjnfnwks8i73pT\nptJ4glk5BUGp5771BAN7ntTeyY25emozew2mMNqq6ALj\n-----END RSA PRIVATE KEY-----"

const server = http.createServer((req, res) => {
  let data = []
  req.on('data', chunk => {
    data.push(chunk)
  })
  req.on('end', () => {
    if(data) {
      req.body = new URLSearchParams(data.toString())
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    try {
      switch(req.url) {
        case '/':
          res.end(renderOrder(req))
          break
        case '/receipt':
          res.end(renderReturnPage(req, 'Test shop receipt page'))
          break
        case '/cancel':
          res.end(renderReturnPage(req, 'Test shop cancel page'))
          break
        default:
          res.statusCode = 404
          res.end('Not found')
          break
      }
    } catch(e) {
      res.statusCode = 400
      res.end(e)
    }  
  })
})

server.listen(port, hostname, () => {
  console.log(`Server running at ${shopUrl}/`)
})

function parseRequestData(data) {
  return new Map(data.toString()
    .split('&')
    .map(item => item.split('=')
      .map(item => decodeURIComponent(item).replace('+', ' '))
    )
  )
}

function renderOrder(req) {
  const sign = crypto.createSign('SHA1')
  const hash = crypto.createHash('SHA256')
  const datetime = new Date()
  const orderdate = datetime.toISOString().replace('T', ' ').split('.')[0]
  
  let fields = new Map()
  fields.set('i-f-1-11_interface-version', '3')
  fields.set('i-f-1-11_interface-version', '3')
  fields.set('i-f-1-3_order-currency-code', '978')
  fields.set('i-t-1-11_bi-unit-count-0', '1')
  fields.set('i-t-1-3_delivery-address-country-code', '246')
  fields.set('i-t-1-4_bi-discount-percentage-0', '0')
  fields.set('i-t-1-4_bi-vat-percentage-0', '2300')
  fields.set('i-t-1-4_order-vat-percentage', '2300')
  fields.set('l-f-1-20_order-gross-amount', '1230')
  fields.set('l-f-1-20_order-net-amount', '1000')
  fields.set('l-f-1-20_order-vat-amount', '230')
  fields.set('l-t-1-20_bi-gross-amount-0', '123')
  fields.set('l-t-1-20_bi-net-amount-0', '100')
  fields.set('l-t-1-20_bi-unit-cost-0', '100')
  fields.set('locale-f-2-5_payment-locale', 'fi_FI')
  fields.set('s-f-1-100_buyer-email-address', 'john.smith@example.com')
  fields.set('s-f-1-10_software-version', '1.0.1')
  fields.set('s-f-1-30_buyer-first-name', 'John')
  fields.set('s-f-1-30_buyer-last-name', 'Smith')
  fields.set('s-f-1-30_software', 'My Web Shop')
  fields.set('s-f-1-36_merchant-agreement-code', shop_merchant_agreement_code)
  fields.set('s-f-1-36_order-number', new Date().getTime()) // Unigue identifier, can be anything.
  
  hash.update(fields.get('s-f-1-36_merchant-agreement-code')+';'+fields.get('s-f-1-36_order-number')+';'+orderdate)
  const paymentToken = hash.digest('hex').substr(0,32).toUpperCase()
  
  fields.set('s-f-32-32_payment-token', paymentToken)
  
  fields.set('s-f-5-128_cancel-url', shop_cancel_url)
  fields.set('s-f-5-128_error-url', shop_cancel_url)
  fields.set('s-f-5-128_expired-url', shop_cancel_url)
  fields.set('s-f-5-128_rejected-url', shop_cancel_url)
  fields.set('s-f-5-128_success-url', shop_receipt_url)
  fields.set('s-t-1-30_bi-name-0', 'test-basket-item-0')
  fields.set('s-t-1-30_buyer-phone-number', '+358 50 234234')
  fields.set('s-t-1-30_delivery-address-city', 'City')
  fields.set('s-t-1-30_delivery-address-line-one', 'Street Address #1')
  fields.set('s-t-1-30_delivery-address-line-three', 'Street Address #3')
  fields.set('s-t-1-30_delivery-address-line-two', 'Street Address #2')
  fields.set('s-t-1-30_delivery-address-postal-code', '00234')
  fields.set('s-t-1-36_order-note', 'x213')
  fields.set('t-f-14-19_order-timestamp', orderdate)
  fields.set('t-f-14-19_payment-timestamp', orderdate)
  
  sign.write(makeSignatureDataFromFields(fields))
  sign.end();
  const signature = sign.sign(shopPrivateKey, 'hex')
  
  fields.set('s-t-256-256_signature-one', signature.toUpperCase())
  
  return `
    <h1>Test Shop Order Page</h1>
    <form id="integration-form" action="${paymentEndPointUrl}" method="post">
    <table>
      ${Array.from(fields).map(([key, value]) => '<tr><td>'+key+'</td><td><input type="text" name="'+key+'"value="'+value+'" /></td></tr>').join('')}
    </table>
    
    <input type="submit" name="s-t-1-40_submit" value="Submit" />
    </form>
  `
}

function renderReturnPage(req, title) {
  if(req.method !== 'POST')
    throw 'Not a POST request.'
  if(!req.body)
    throw 'No POST request data.'
  
  let fields = new Map(Array.from(req.body))
  fields.set('signature-validation', checkSignature(fields))

  return `
  <h1>${title}</h1>
  <form id="integration-form" action="/" method="POST">
    <table>
     ${Array.from(fields).sort().map(([key, value]) => '<tr><td>'+key+'</td><td><input type="text" name="'+key+'"value="'+value+'" /></td></tr>').join('')}
    </table>
    <input type="submit" name="submit" value="New Order"/>
  </form>
  `
}

function makeSignatureDataFromFields(fields) {
  return Array.from(fields)
    // Field order has to follow this collation: "-0123456789_abcdefghijklmnopqrstuvwxyz"
    // Sorting here fills the requirement.
    .sort()
    .map(([key, value]) => key+'='+value+';')
    .join('')
}

function checkSignature(fields) {
    if(!fields.get('s-t-256-256_signature-one')) {
      return 'no signature'
    }
    const signature = fields.get('s-t-256-256_signature-one')
    let signatureData = new Map(fields)
    // Follofing fields are excluded from the signature data.
    signatureData.delete('s-t-1-40_shop-order__phase')
    signatureData.delete('s-t-256-256_signature-one')
    signatureData.delete('s-t-256-256_signature-two')
  
    const verify = crypto.createVerify('SHA1')
    verify.write(makeSignatureDataFromFields(signatureData));
    verify.end();
    return verify.verify(payPagePublicKey, signature, 'hex') ? 'valid' : 'invalid'
}