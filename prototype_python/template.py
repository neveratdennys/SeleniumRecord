from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

options = Options()
# Toggle this line for headless mode
options.add_argument("--headless=new")
driver = webdriver.Chrome(options=options)
driver.implicitly_wait(15)
# Add formatted record tool output here


driver.quit()
