const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");
var CronJob = require("cron").CronJob;

const URL = "https://api.watchville.co/v2/posts?context=popular";
const date_now = new Date().toLocaleString().replace(/:/g, "-");

// date of the scrape, position in the top ten, title of the article , link and blog name
const watcher = async () => {
  console.log("watcher begins");
  const response_data = await get_popular_news();
  //   console.log(response_data);
  const popular_news_json_arr = await process_popular_news(response_data);
  //   console.log(popular_news_json_arr)

  await write_to_google_sheets(popular_news_json_arr);
};

const get_popular_news = async () => {
  let responses;
  await axios.get(URL).then(res => (responses = res.data));
  console.log("get_popular_news done");
  return responses;
};

const process_popular_news = async response_data => {
  let posts_arr = response_data.posts;
  let feeds_arr = response_data.feeds;
  let popular_news_json_arr = [];

  for (let [i, post] of posts_arr.entries()) {
    let popular_news_json = {};

    // popular_news_json.scrape_date = date_now;
    popular_news_json.position = i + 1;
    popular_news_json.title = post.title;
    popular_news_json.link = post.source_url;

    for (feed of feeds_arr) {
      if (post.feed_id == feed.id) {
        popular_news_json.blog_name = feed.title;
      }
    }

    popular_news_json_arr.push(popular_news_json);
  }

  console.log("process_popular_news done");

  return popular_news_json_arr;
};

const write_to_google_sheets = async popular_news_json_arr => {
  try {
    const doc = await connect_google_spreadsheet();

    const newSheet = await doc.addSheet({
      title: date_now,
      headerValues: ["position", "title", "link", "blog_name"]
    });
    const moreRows = await newSheet.addRows(popular_news_json_arr);

    console.log("write_to_google_sheets done ", date_now);
  } catch (error) {
    console.log(error);
  }
};

const connect_google_spreadsheet = async () => {
  try {
    // spreadsheet key is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(
      "1__Y2SSLeqgib32ZwhDGtk_KcPwQZe47mTUDxoBxwiv4"
    );
    await doc.useServiceAccountAuth(require("./credentials.json"));

    await doc.loadInfo(); // loads document properties and worksheets

    console.log("connect_google_spreadsheet done");

    return doc;
  } catch (error) {
    console.log(error);
  }
};

let job = new CronJob(
  "* * * * * *",
  function() {
    // watcher();
    console.log("HIII")
  },
  null,
  true,
  "America/New_York"
);
job.start();
