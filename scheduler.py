"""
⏰ NEWS PIPELINE SCHEDULER
Automates the news collection pipeline on a schedule
"""

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
from run_pipeline import NewsPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('news_pipeline.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class NewsScheduler:
    def __init__(self):
        self.scheduler = BlockingScheduler()
        self.pipeline = None
    
    def run_full_collection(self):
        """Job: Full collection across all categories"""
        try:
            logger.info("="*70)
            logger.info("🚀 SCHEDULED FULL COLLECTION STARTED")
            logger.info("="*70)
            
            self.pipeline = NewsPipeline(delay_between_scrapes=2)
            stats = self.pipeline.run_full_collection(max_per_query=5)
            self.pipeline.save_stats(
                f"stats/pipeline_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            
            logger.info(f"✅ Collection complete: {stats['stored']} new articles stored")
            
        except Exception as e:
            logger.error(f"❌ Collection failed: {e}", exc_info=True)
    
    def run_quick_update(self):
        """Job: Quick update with fewer articles"""
        try:
            logger.info("🔄 QUICK UPDATE STARTED")
            
            self.pipeline = NewsPipeline(delay_between_scrapes=1)
            stats = self.pipeline.run_full_collection(max_per_query=2)
            
            logger.info(f"✅ Quick update complete: {stats['stored']} new articles")
            
        except Exception as e:
            logger.error(f"❌ Quick update failed: {e}", exc_info=True)
    
    def run_category_update(self, category):
        """Job: Update a single category"""
        try:
            logger.info(f"📂 CATEGORY UPDATE: {category}")
            
            self.pipeline = NewsPipeline(delay_between_scrapes=1)
            stats = self.pipeline.run_full_collection(
                max_per_query=3,
                categories=[category]
            )
            
            logger.info(f"✅ {category} update complete: {stats['stored']} new articles")
            
        except Exception as e:
            logger.error(f"❌ {category} update failed: {e}", exc_info=True)
    
    def schedule_daily(self, hour=9, minute=0):
        """Schedule full collection once per day"""
        self.scheduler.add_job(
            self.run_full_collection,
            CronTrigger(hour=hour, minute=minute),
            id='daily_collection',
            name=f'Daily Collection ({hour:02d}:{minute:02d})',
            replace_existing=True
        )
        logger.info(f"📅 Scheduled daily collection at {hour:02d}:{minute:02d}")
    
    def schedule_hourly(self):
        """Schedule quick updates hourly"""
        self.scheduler.add_job(
            self.run_quick_update,
            CronTrigger(minute=0),
            id='hourly_update',
            name='Hourly Quick Update',
            replace_existing=True
        )
        logger.info("🕐 Scheduled hourly quick updates")
    
    def schedule_every_6_hours(self):
        """Schedule updates every 6 hours"""
        self.scheduler.add_job(
            self.run_full_collection,
            CronTrigger(hour='*/6'),
            id='six_hourly_collection',
            name='Every 6 Hours Collection',
            replace_existing=True
        )
        logger.info("🕕 Scheduled collection every 6 hours")
    
    def schedule_tech_updates(self):
        """Schedule frequent Technology updates"""
        self.scheduler.add_job(
            lambda: self.run_category_update('Technology'),
            CronTrigger(minute='*/30'),  # Every 30 minutes
            id='tech_updates',
            name='Technology Updates (30min)',
            replace_existing=True
        )
        logger.info("💻 Scheduled Technology updates every 30 minutes")
    
    def start(self):
        """Start the scheduler"""
        logger.info("\n" + "="*70)
        logger.info("⏰ NEWS PIPELINE SCHEDULER STARTING")
        logger.info("="*70)
        
        # Show scheduled jobs
        jobs = self.scheduler.get_jobs()
        if jobs:
            logger.info(f"\n📋 Scheduled Jobs ({len(jobs)}):")
            for job in jobs:
                logger.info(f"   • {job.name}: {job.trigger}")
        else:
            logger.warning("⚠️  No jobs scheduled!")
        
        logger.info(f"\n🚀 Scheduler running... (Press Ctrl+C to stop)")
        logger.info("="*70 + "\n")
        
        try:
            self.scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            logger.info("\n⏹️  Scheduler stopped by user")
            self.scheduler.shutdown()


# 🎯 PRESET CONFIGURATIONS

def quick_schedule():
    """Quick hourly updates"""
    scheduler = NewsScheduler()
    scheduler.schedule_hourly()
    scheduler.start()


def standard_schedule():
    """Standard: Daily at 9 AM + Tech updates every 30 min"""
    scheduler = NewsScheduler()
    scheduler.schedule_daily(hour=9, minute=0)
    scheduler.schedule_tech_updates()
    scheduler.start()


def intensive_schedule():
    """Intensive: Every 6 hours + frequent tech updates"""
    scheduler = NewsScheduler()
    scheduler.schedule_every_6_hours()
    scheduler.schedule_tech_updates()
    scheduler.start()


def custom_schedule(daily_hour=9, enable_hourly=False, enable_tech=False):
    """Custom schedule configuration"""
    scheduler = NewsScheduler()
    
    scheduler.schedule_daily(hour=daily_hour, minute=0)
    
    if enable_hourly:
        scheduler.schedule_hourly()
    
    if enable_tech:
        scheduler.schedule_tech_updates()
    
    scheduler.start()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
        
        if mode == "quick":
            quick_schedule()
        elif mode == "standard":
            standard_schedule()
        elif mode == "intensive":
            intensive_schedule()
        elif mode == "now":
            # Run once now (for testing)
            logger.info("🧪 Running pipeline once (test mode)...")
            pipeline = NewsPipeline()
            pipeline.run_full_collection(max_per_query=3)
        else:
            print(f"❌ Unknown mode: {mode}")
            print("\nUsage:")
            print("  python scheduler.py quick       # Hourly updates")
            print("  python scheduler.py standard    # Daily + Tech updates")
            print("  python scheduler.py intensive   # Every 6h + Tech updates")
            print("  python scheduler.py now         # Run once now (test)")
    else:
        print("⚠️  No schedule mode specified")
        print("\nAvailable modes:")
        print("  quick     - Hourly quick updates")
        print("  standard  - Daily at 9 AM + Tech updates every 30 min")
        print("  intensive - Every 6 hours + frequent tech updates")
        print("  now       - Run once immediately (test)")
        print("\nExample: python scheduler.py standard")
