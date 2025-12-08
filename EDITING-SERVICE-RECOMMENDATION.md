# 🎬 Recommended Editing Service for Long-Form Content

## Recommendation: **Descript**

For long-form video editing (podcasts & solo YouTube videos) based on editing prompts, I recommend **Descript**.

### Why Descript?

1. **AI-Powered Editing**: Descript has advanced AI editing capabilities that can follow prompts and instructions
2. **API Access**: Offers robust API for programmatic video processing
3. **Podcast-Focused**: Built specifically for podcast editing workflows
4. **Prompt-Based Editing**: Can process videos based on detailed instructions
5. **Multiple Rendering**: Supports generating multiple versions/renders
6. **Reliable**: Industry-standard tool used by major podcasters

### Alternative Options:

1. **RunwayML** - AI video editing (more experimental)
2. **Custom API** - Build your own editing service
3. **Zapier/Make Automation** - Connect to multiple editing services

### Implementation Note:

The system is built to be **service-agnostic**. You can integrate any editing service by:
- Updating `editing_service` field in `video_editing_jobs`
- Creating API client in `src/lib/[service-name].ts`
- Adding webhook handler in `src/app/api/webhooks/[service-name]/route.ts`

---

**Next Steps**: 
- Sign up for Descript API (or your preferred service)
- Add API credentials to environment variables
- Integrate API client and webhook handlers









